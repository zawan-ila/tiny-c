// Helpful for generating unique labels
var n = 1
function getUniqueInteger(){
    return n++
}

// This is the object that represents a declared variable
class TypedElement{
    constructor(id, type, scope, len, mapping = undefined){
        this.id = id
        this.type = type
        this.scope = scope 
        this.len = len
        this.mapping = mapping
    }
}

class Environment{
    constructor(){
        this.scopeList = [[]] 
        this.prevOffset = [] 
        this.offset = 0
        this.break_labels = []
        this.continue_labels = []
        this.globals = []
        this.params = []
    }

    reset(){
        // Called when entering new function
        this.scopeList = [[]]
        this.prevOffset = [] 
        this.offset = 0
        this.break_labels = []
        this.continue_labels = []
        this.params = []
    }

    break(){
        // get the label to break to (in a loop)
        if (this.break_labels.length < 1)
            return undefined
        
        return this.break_labels[this.break_labels.length - 1]
    }

    continue(){
        // get the label to continue to (in a loop)
        if (this.continue_labels.length < 1)
            return undefined
        
        return this.continue_labels[this.continue_labels.length - 1]
    }
    search(variable){
        // search in local scope
        for (let tmp = this.scopeList.length - 1; tmp >= 0; tmp --){
            for(let innertmp = 0; innertmp < this.scopeList[tmp].length; innertmp ++){
                if (this.scopeList[tmp][innertmp].id == variable){
                    return this.scopeList[tmp][innertmp]
                }
            }
        }

        // search in parameters
        for(let tmp = 0; tmp < this.params.length; tmp ++){
            if(this.params[tmp].id == variable){
                return this.params[tmp]
            }
        }

        // search in globals
        for(let tmp = 0; tmp < this.globals.length; tmp ++){
            if(this.globals[tmp].id == variable){
                return this.globals[tmp]
            }
        }

        return undefined
    }

    add(te){
        // add a variable to the environment
        // te is an instance of TypedElement

        if(te.scope == "local"){
            this.offset -= te.len
            te.mapping = this.offset
            this.scopeList[this.scopeList.length - 1].push(te)
        }

        else if(te.scope == "global"){
            this.globals.push(te)
        }

        else if(te.scope == "parameter"){
            this.params.push(te)
        }

        return this.offset
    }

    in_scope(v){
        // check if v is in local scope or is a parameter

        for(let tmp = 0; tmp < this.scopeList[this.scopeList.length - 1].length; tmp++){
            if (this.scopeList[this.scopeList.length - 1][tmp].id == v){
                return true
            }
        }

        for (let tmp = 0; tmp < this.params.length; tmp++){
            if (this.params[tmp].id == v){
                return true
            }
        }
        return false
    }

    enter_scope(){
        // enter a nested scope
        this.prevOffset.push(this.offset)
        this.scopeList.push([])
    }

    exit_scope(){
        // exit from a nested scope
        let esp_movement = this.prevOffset.pop()
        this.offset = esp_movement
        this.scopeList.pop()
        return esp_movement
    }
}

let env = new Environment()

export class CodeGenerator{
    constructor(ast){
        this.nodes = ast.nodes
    }

    GenerateExpression(exp){
        let asm = ""

        if (exp.__proto__.constructor.name == "FunCallNode"){
            for(let tmp = exp.args.length - 1; tmp >= 0 ; tmp --){
                asm += this.GenerateExpression(exp.args[tmp])
            }

            asm += `call _${exp.name}\n`
            asm += `addl $${exp.args.length * 4}, %esp\n`
            asm += `pushl %eax\n`
        }

        else if (exp.__proto__.constructor.name == "ConstantNode"){
            asm += `pushl $${exp.num}\n`
        }

        else if(exp.__proto__.constructor.name == "UnaryNode"){
            asm += this.GenerateExpression(exp.operand)
            asm += `pop %eax\n`

            if(exp.op == "-"){
                asm += `neg %eax\n`
            }
            else if(exp.op == "~"){
                asm += `not %eax\n`
            }
            else if(exp.op == "!"){
                asm += "cmpl $0, %eax\n"
                asm += "movl $0, %eax\n"
                asm += "sete %al\n"
            }

            asm += `pushl %eax\n`

        }

        else if(exp.__proto__.constructor.name == "BinOpNode"){

            if(exp.op == undefined){
                asm += `pushl $1\n`
            }

            else if(exp.op == "&&"){

                asm += this.GenerateExpression(exp.left)
                asm += "pop %eax\n"
                asm += "cmpl $0, %eax\n"

                let ol = getUniqueInteger()
                asm += `je and_end_${ol}\n`
                
                asm += `movl $0, %eax\n`
                asm += this.GenerateExpression(exp.right)
                asm += `pop %ebx\n`

                asm += `cmpl $0, %ebx\n`
                asm += `setne %al\n`

                asm += `\nand_end_${ol}:\n`
                asm += `pushl %eax\n`
            
            }

            else if(exp.op == "||"){

                asm += this.GenerateExpression(exp.left)
                asm += "pop %eax\n"

                asm += "cmpl $0, %eax\n"

                let ol = getUniqueInteger()
                asm += `je or_helper_label_${ol}\n`
                asm += `movl $1, %eax\n`

                let el = getUniqueInteger()
                asm += `jmp or_end_${el}\n`

                asm += `\nor_helper_label_${ol}:\n`

                asm += this.GenerateExpression(exp.right)
                asm += `pop %ebx\n`
                asm += `movl $0, %eax\n`
                asm += `cmpl $0, %ebx\n`
                asm += `setne %al\n`
                asm += `\nor_end_${el}:\n`

                asm += `pushl %eax\n`

            }

            else{

                asm += this.GenerateExpression(exp.right)
                asm += this.GenerateExpression(exp.left)
                asm += `pop %eax\n`
                asm += `pop %ebx\n`

                if(exp.op == "+"){
                    asm += `addl %ebx, %eax\n`
                }
                else if(exp.op == "-"){
                    asm += `subl %ebx, %eax\n`
                }
                else if(exp.op == "*"){
                    asm += `imul %ebx, %eax\n`
                }
    
                else if(exp.op == "/"){
                    asm += "cdq\n"
                    asm += "idivl %ebx\n"
                }
    
                else if(exp.op == "%"){
                    asm += "cdq\n"
                    asm += "idivl %ebx\n"
                    asm += "movl %edx, %eax\n"
                }
    
                else if(exp.op == "=="){
                    asm += "cmpl %eax, %ebx\n"
                    asm += "movl $0, %eax\n"
                    asm += "sete %al\n"
                }
                else if(exp.op == "!="){

                    asm += "cmpl %eax, %ebx\n"
                    asm += "movl $0, %eax\n"
                    asm += "setne %al\n"
    
                }
                else if(exp.op == ">="){
               
                    asm += "cmpl %eax, %ebx\n"
                    asm += "movl $0, %eax\n"
                    asm += "setle %al\n"
    
                }
                else if(exp.op == "<="){
               
                    asm += "cmpl %eax, %ebx\n"
                    asm += "movl $0, %eax\n"
                    asm += "setge %al\n"

                }
                else if(exp.op == "<"){
                
                    asm += "cmpl %eax, %ebx\n"
                    asm += "movl $0, %eax\n"
                    asm += "setg %al\n"
    
                }
                else if(exp.op == ">"){
    
                    asm += "cmpl %eax, %ebx\n"
                    asm += "movl $0, %eax\n"
                    asm += "setl %al\n"
    
                }
    
                else{
                    console.log('Binary Operator not recognized')
                    process.exit(1)
                }

                asm += `pushl %eax\n`

            }

        }

        else if(exp.__proto__.constructor.name == "AssignmentNode"){
            asm += this.GenerateExpression(exp.right)
            // val to be assigned on stack

            let lvalue = env.search(exp.left.id)
            switch (lvalue.scope){
                case 'local':
                    switch(lvalue.type){
                        case 'array':
                            // local array
                            asm += this.GenerateExpression(exp.left.type)
                            asm += `pop %eax\n` // array index
                            asm += `pop %ecx\n` // val to be assigned
                            asm += `movl %ecx, ${lvalue.mapping}(%ebp, %eax, 4)\n`
                            asm += `pushl %ecx\n`
                            break

                        case 'integer':
                            // local integer   
                            asm += `pop %ecx\n` // val to be assigned
                            asm += `movl %ecx, ${lvalue.mapping}(%ebp)\n`
                            asm += `pushl %ecx\n`
                            break
                    }
                    break
        
                case 'parameter':
                    switch (lvalue.type){
                        case 'array':
                            // parameter array
                            asm += this.GenerateExpression(exp.left.type)
                            asm += `pop %eax\n` // index
                            asm += `pop %ecx\n` // val

                            asm += `movl ${lvalue.mapping}(%ebp), %ebx\n` 
                            asm += `movl %ecx, 0(%ebx, %eax, 4)\n`
                            asm += `pushl %ecx\n`

                            break

                        case 'integer':
                            // parameter integer  
                            asm += `pop %ecx\n` // val to assign
                            asm += `movl %ecx, ${lvalue.mapping}(%ebp)\n`
                            asm += `pushl %ecx\n`

                            break
                    }
                    break
                
                case 'global':
                    switch (lvalue.type){
                        case 'array':
                            // global array
                            asm += this.GenerateExpression(exp.left.type)
                            asm += `pop %eax\n` // array idx
                            asm += `pop %ecx\n` // val to be assigned

                            asm += `movl %ecx, ${lvalue.mapping}(, %eax, 4)\n`
                            asm += `pushl %ecx\n`
                            break

                        case 'integer':
                            // global integer   
                            asm += `pop %ecx\n` //val to assign
                            asm += `movl %ecx, ${lvalue.mapping}\n`
                            asm += `pushl %ecx\n`
                            break
                    }
                    break

            }

        }

        else if(exp.__proto__.constructor.name == "CondExpNode"){

            asm += this.GenerateExpression(exp.cond)
            asm += `pop %eax\n`
            asm += `cmpl $0, %eax\n`
    
            let if_num = getUniqueInteger()
            let el_num = getUniqueInteger()
            let end_num = getUniqueInteger()
    
            asm += `je else_label_${el_num}\n`
            asm += this.GenerateExpression(exp.if)
            asm += `jmp end_label_${end_num}\n`
            asm += `\nelse_label_${el_num}:\n`
                
            asm += this.GenerateExpression(exp.else)
            asm += `\nend_label_${end_num}:\n`
    
        }

        else if(exp.__proto__.constructor.name == "VarNode"){

            let rvalue = env.search(exp.id)

            switch (rvalue.scope){
                case 'local':
                    switch(rvalue.type){
                        case 'array':
                            // local array

                            if (exp.type == "integer"){
                                asm += `leal ${rvalue.mapping}(%ebp), %ecx\n`
                                asm += `pushl %ecx\n`
                            }
                            else{

                            asm += this.GenerateExpression(exp.type)
                            asm += `pop %eax\n` // array index
                            asm += `movl  ${rvalue.mapping}(%ebp, %eax, 4), %ecx\n`
                            asm += `pushl %ecx\n`
                            
                            }
                            break

                        case 'integer':
                            // local integer   
                            asm += `movl ${rvalue.mapping}(%ebp), %ecx\n`
                            asm += `pushl %ecx\n`
                            break
                    }

                    break
                
                case 'parameter':
                    switch (rvalue.type){
                        case 'array':
                            // parameter array
                            if (exp.type == "integer"){
                                asm += `movl ${rvalue.mapping}(%ebp), %ecx\n`
                                asm += `pushl %ecx\n`
                            }
                            else{
                                asm += this.GenerateExpression(exp.type)
                                asm += `pop %eax\n` // index

                                asm += `movl ${rvalue.mapping}(%ebp), %ecx\n` 
                                asm += `movl 0(%ecx, %eax, 4), %edx\n`
                                asm += `pushl %edx\n`
                            }
                            break

                        case 'integer':
                            // parameter integer   
                            asm += `movl ${rvalue.mapping}(%ebp), %ecx\n`
                            asm += `pushl %ecx\n`
                            break
                    }
                    break
                
                case 'global':
                    switch (rvalue.type){
                        case 'array':
                            // global array
                            if (exp.type == "integer"){
                                asm += `movl $${rvalue.mapping}, %ecx\n`
                                asm += `pushl %ecx\n`
                            }
                            else{
                                asm += this.GenerateExpression(exp.type)
                                asm += `pop %eax\n` // array idx
                                asm += `movl ${rvalue.mapping}(, %eax, 4), %ecx\n`
                                asm += `pushl %ecx\n`
                            }

                            break

                        case 'integer':
                            // global integer   

                            asm += `movl ${rvalue.mapping}, %ecx\n`
                            asm += `pushl %ecx\n`
                            break
                    }
                    break
            }
        }
        return asm
    }

    GenerateIfStatement(cn){
        let asm = ""
        asm += this.GenerateExpression(cn.cond)
        asm += `pop %eax\n`
        asm += `cmpl $0, %eax\n`

        let if_num = getUniqueInteger()
        let el_num = getUniqueInteger()
        let end_num = getUniqueInteger()

        asm += `je else_label_${el_num}\n`
        asm += this.GenerateStatement(cn.if)
        asm += `jmp end_label_${end_num}\n`
        asm += `\nelse_label_${el_num}:\n`

        if(cn.else)
            asm += this.GenerateStatement(cn.else)

        asm += `\nend_label_${end_num}:\n`
        return asm
    }

    GenerateStatement(stmt){
        // console.log(stmt)
        let asm = ""
        if (stmt.type == "return"){
            asm += this.GenerateExpression(stmt.exp)
            asm += "pop %eax\n"
            asm += "leave\nret\n"
        }

        else if(stmt.__proto__.constructor.name == "DeclNode"){
            let var_n = stmt.left

            if (env.in_scope(var_n.id)){
                console.log('Error redeclaration of', var_n.id)
                process.exit(1)
            }

            if (stmt.right){
                asm += this.GenerateExpression(stmt.right)
            }
            else{

                if (var_n.type == "integer"){
                    asm += `pushl $0\n`
                }
                else{

                    for (let yoo = 0; yoo < var_n.type; yoo ++){
                        asm += `pushl $0\n`

                    }
                }
            }

            env.add(new TypedElement(var_n.id, var_n.type == "integer" ? "integer" :"array" ,"local", 
                                                                        var_n.type == "integer"? 4 : 4*var_n.type)) // MAPPING UNDEF?

        }

        else if(stmt.__proto__.constructor.name == "CondNode"){
            asm += this.GenerateIfStatement(stmt)
        }

        else if(stmt.__proto__.constructor.name == "CompoundStatementNode"){

            env.enter_scope()
            for (let smt of stmt.statements){
                asm += this.GenerateStatement(smt)
            }

            let redemption = env.exit_scope()
            asm += `movl %ebp, %ecx\n`
            asm += `addl $${redemption}, %ecx\n`
            asm += `movl %ecx, %esp\n`

        }

        else if(stmt.__proto__.constructor.name == "ForNode"){
            env.enter_scope()

            let fi = getUniqueInteger()
            asm += `\nfor_initializer_${fi}:\n`
            asm += this.GenerateStatement(stmt.pre_exp)

            let ti = getUniqueInteger()
            asm += `\ntest_${ti}:\n`

            asm += this.GenerateExpression(stmt.test_exp)
            asm += `pop %eax\n`
            asm += `cmpl $0, %eax\n`

            let ei = getUniqueInteger()
            let ii = getUniqueInteger()

            asm += `je end_loop_${ei}\n`
            env.break_labels.push(`end_loop_${ei}`)
            env.continue_labels.push(`inc_stuff_${ii}`)

            asm += this.GenerateStatement(stmt.body)

            asm += `\ninc_stuff_${ii}:\n`
            asm += this.GenerateStatement(stmt.post_exp)

            asm += `jmp test_${ti}\n`
            asm += `\nend_loop_${ei}:\n`

            // clean break labels etc
            env.break_labels.pop()
            env.continue_labels.pop()

            let redemption = env.exit_scope()
            asm += `movl %ebp, %ecx\n`
            asm += `addl $${redemption}, %ecx\n`
            asm += `movl %ecx, %esp\n`
            
        }

        else if(stmt.__proto__.constructor.name == "BreakNode"){
            if (env.break() == undefined){
                console.log('Nothing to break to')
                process.exit(1)
            }

            asm += `jmp ${env.break()}\n`
        }

        else if(stmt.__proto__.constructor.name == "ContNode"){
            if (env.continue() == undefined){
                console.log('Nothing to cont to')
                process.exit(1)
            }

            asm += `jmp ${env.continue()}\n`
        }

        else {
            // Expression?
            asm += this.GenerateExpression(stmt)
            asm += `pop %eax\n`
        }

        return asm
    }

    GenerateFunction(fn){

        // We append _ to names of all functions
        env.reset()
        let asm = `_${fn.name}:\n`
        asm += `pushl %ebp\n`
        asm += `movl %esp, %ebp\n`

        let pseudo = 8
        for(let tmp = 0; tmp <= fn.args[0].length - 1; tmp ++ ){
            env.add(new TypedElement(fn.args[0][tmp],fn.args[1][tmp] == "integer"? "integer": "array","parameter",4,pseudo))
            pseudo += 4
        }

        for(let s of fn.nodes){
            let stmt_asm = this.GenerateStatement(s)
            asm += stmt_asm
        }

        asm += "leave\nret\n"
        return asm
    }

    Generate(){
        let tot_asm = ".text\n"

        for(let node of this.nodes){
            if (node.__proto__.constructor.name == "FunctionNode"){
                tot_asm += `.globl _${node.name}\n`
            }
        }

        for(let node of this.nodes){
            if (node.__proto__.constructor.name == "FunctionNode"){
                tot_asm += this.GenerateFunction(node)
            }

            else{
                // global variable?
                tot_asm += ".data\n"
                tot_asm += `_${node.left.id}:\n`
                
                env.add(new TypedElement(node.left.id, node.left.type == "integer" ? "integer": "array", "global", 
                node.left.type == "integer" ? 4: node.left.type.num * 4, `_${node.left.id}`))

                if (node.left.type == "integer"){
                    tot_asm += `.long ${node.right? node.right.num : 0}\n`

                }
                else{
                    for (let tmp = 0; tmp < node.left.type; tmp ++){
                        tot_asm += `.long 0\n`
                    }
                }

                tot_asm += `.text\n`
            }
        }
        return tot_asm
    }


}