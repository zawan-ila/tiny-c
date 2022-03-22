
class ProgramNode{
    constructor(){
        this.nodes = [] // this will contain all the function definitions and global declarations
    }
}

class ContNode{
    constructor(){

    }
}

class BreakNode{
    constructor(){

    }
}

class DeclNode{
    constructor(id, val = undefined){
        this.left = id
        this.right = val
    }
}

class ForNode{
    constructor(pre_exp, test, post_exp, body){
        this.pre_exp = pre_exp
        this.test_exp = test
        this.post_exp = post_exp
        this.body = body
    }
}

class VarNode{
    constructor(id, tp = "integer"){
        this.id = id
        this.type = tp
    }
}

class AssignmentNode{
    constructor(op, left, right){
        this.op = op
        this.left = left
        this.right = right
    }
}

class CondNode{
    constructor(cond, to_do, to_do_else){
        this.cond = cond
        this.if = to_do
        this.else = to_do_else
    }
}

class CondExpNode{
    constructor(cond, ifexp, elseexp){
        this.cond = cond
        this.if = ifexp
        this.else = elseexp
    }
}

class FunctionNode{
    constructor(name, args, nodes){
        this.name = name // name of a function
        this.args = args // The parameters a function takes e.g [foo, bar]
        this.nodes = nodes // this will contain the statement nodes of the function
    }
}

class CompoundStatementNode{
    constructor(stmt_list){
        this.statements = stmt_list
    }
}

class FunCallNode{
    constructor(name, arglist){
        this.name = name
        this.args = arglist
    }
}

class ReturnNode{
    constructor(type, exp = null){
        this.type = type
        this.exp = exp
    }
}

class BinOpNode{
    constructor(op, lt= null, rt = null){
        this.op = op
        this.left = lt
        this.right = rt
    }
}

class ConstantNode{
    constructor(num){
        this.num = num
    }
}

class UnaryNode{
    constructor(op, operand = null){
        this.op = op
        this.operand = operand
    }
}

export class Parser{
    constructor(toks){
        this.toks = toks
        this.root = new ProgramNode()
        this.idx = 0
    }

    getTok(){
        if (this.idx >= this.toks.length){
            this.idx++
            return null
        }

        return this.toks[this.idx++]
    }

    putTok(){
        this.idx --
    }

    assert(k = null, v = null){
        let nt = this.getTok()
        let status = false

        if (! nt){
            console.log(`Error. End of File when Parsing`)
            process.exit()
        }

        else if( (!k || nt.kind == k) && (!v || nt.value == v) ){
            status = true
        }
        
        if (! status){
            console.log(`Error. Expected Token k = ${k} v = ${v} Received k = ${nt.kind} v = ${nt.value} At line ${nt.line}`)
            process.exit()
        }
        
        //this.putTok()
        return nt

    }

    peek(){
        return this.toks[this.idx]
    }

    pop(){
        return this.getTok()
    }

    ParseParams(){
        this.assert(undefined,  "(")
        let types = []
        let args = []
        while(this.peek() && this.peek().value != ")"){
            this.assert(undefined, "int")
            let varname = this.getTok()
            let array = 0
            if (this.peek().value == "["){
                while(this.peek().value != "]"){
                    this.pop()
                }

                this.pop()
                array = 1
            }
            if(this.peek().value != ")")
                this.assert("comma")

            args.push(varname.value)
            if(array){
                types.push("array")
            }
            else{
                types.push("integer")
            }

        }

        this.assert(undefined,  ")")
        return [args,types]
    }

    getAtom(){

        
        let nt = this.getTok()
        if (! nt){
            console.log('Error. Expression Not FOund')
            process.exit(1)
        }

        if (nt.kind == "integer"){
            return new ConstantNode(Number(nt.value))        
        }

        else if (nt.value == "-"){
            let op = "-"

            return new UnaryNode(op, this.getAtom())
        
        }


        else if (nt.value == "~"){
            let op = "~"

            return new UnaryNode(op, this.getAtom())
        
        }


        else if (nt.value == "!"){
            let op = "!"

            return new UnaryNode(op, this.getAtom())
        }

        else if (nt.kind == "lparen"){

            let exp_node = this.ParseExp()
            this.assert("rparen", undefined)
            return exp_node
        }

        else if (nt.kind == "id"){

            let args = []
            if(this.peek().value == "("){
                this.assert("lparen")
                while(this.peek().value != ")"){
                    args.push(this.ParseExp())
                    if(this.peek().value != ")")
                        this.assert('comma')
                }

                this.assert(undefined, ")")

                return new FunCallNode(nt.value, args)
            }

            let len = "integer"
            
            if (this.peek().kind == "lbrack"){
                this.pop()
                len = this.ParseExp()
                this.assert("rbrack")
            }

            return new VarNode(nt.value, len)
        }

        else {
            console.log('GetATom Failed At', nt)
            process.exit(1)
        }
    }


    getFactor(){

        
        let atm = this.getAtom()
        while(this.peek() && ['*', '/', '%'].includes(this.peek().value)){
            let op = this.pop().value
            let natm = this.getAtom()
            atm = new BinOpNode(op, atm, natm)

        }

        return atm

    }

    ParseArithmeticExp(){
        
        let factor = this.getFactor()

        while(this.peek() && ['+', '-'].includes(this.peek().value)){
            let op = this.pop().value
            let nfac = this.getFactor()
            factor = new BinOpNode(op, factor, nfac)

        }

        return factor

    }

    ParseRelationalExp(){
        let arithexp = this.ParseArithmeticExp()

        while(this.peek() && ['<', '>', '<=', '>='].includes(this.peek().value)){
            let op = this.getTok().value
            let narithexp = this.ParseArithmeticExp()

            arithexp = new BinOpNode(op, arithexp, narithexp)
        }

        return arithexp
    }

    ParseEqualityExp(){
        let relexp = this.ParseRelationalExp()

        while (this.peek() && ['!=', '=='].includes(this.peek().value)){
            let op = this.getTok().value
            let nrelexp = this.ParseRelationalExp()

            relexp = new BinOpNode(op, relexp, nrelexp)
        }

        return relexp
    }

    ParseAndExp(){
        let eqexp = this.ParseEqualityExp()

        while(this.peek() && this.peek().value == "&&" ){
            let op = this.getTok().value
            let neqexp = this.ParseEqualityExp()
            eqexp = new BinOpNode(op, eqexp, neqexp)
        }

        return eqexp
    }

    ParseOrExp(){
        let andexp = this.ParseAndExp()

        while(this.peek() && this.peek().value == "||"){
            let op = this.getTok().value
            let nandexp = this.ParseAndExp()
            andexp = new BinOpNode(op, andexp, nandexp)
        }

        return andexp
    }

    ParseCondExp(){
        let orexp = this.ParseOrExp()
        let ifexp = undefined
        let elseexp = undefined

        if (this.peek().value == "?"){
            this.pop()
            ifexp = this.ParseExp()
            this.assert("colon")
            elseexp = this.ParseCondExp()
        }

        if (!ifexp)
            return orexp

        return new CondExpNode(orexp, ifexp, elseexp)

    }

    ParseExp(){

        if(this.peek() && this.peek().kind == 'id'){
            let rvidx = this.idx

            let id = this.getTok()
            let len = "integer"

            if(this.peek().value == "["){
                this.pop()
                len = this.ParseExp()
                this.assert("rbrack")
            }

            if(this.peek() && this.peek().kind == "assignment"){
                let asn = this.getTok()
                let exp = this.ParseExp()
                let an =  new AssignmentNode(asn.value, new VarNode(id.value, len), exp)
                // console.log(an)
                return an
            }

            else{
                this.idx = rvidx
                
            }
        }

        else if (this.peek().kind == "semicolon"){
            return new BinOpNode(undefined, undefined, undefined);
        }

        return this.ParseCondExp()

    }

    ParseDecl(){
        if(this.peek() && this.peek().value == "int"){
            this.pop()

            let iden = this.getTok().value
            let decl_node = new DeclNode(new VarNode(iden))

            if (this.peek().value == "["){
                this.pop()
                let len = this.getTok()
                decl_node.left.type = len.value
                this.assert("rbrack")
            }


            if(this.peek() && this.peek().kind == "assignment"){
                // Is an initialization
                this.pop()
                let val = this.ParseExp()
                decl_node.right = val                

            }

            this.assert('semicolon')

            return decl_node
        }

        else return undefined
    }

    ParseStatement(){
    
        if (this.peek().kind == "lbrace"){
            this.pop()
            let stmts = []
            while (this.peek() && this.peek().kind != "rbrace"){
                let new_stmt = this.ParseBlockItem()
                stmts.push(new_stmt)
            }

            this.assert("rbrace")

            return new CompoundStatementNode(stmts)

        }

        else if (this.peek() && this.peek().value == "return"){
            this.pop()
            let exp_to_ret = this.ParseExp()
            this.assert(undefined, ";")
            return new ReturnNode("return", exp_to_ret)

        }

        else if(this.peek() && this.peek().value == "if"){
            this.getTok()
            this.assert('lparen')
            let cond = this.ParseExp()
            this.assert('rparen')

            let stmt = this.ParseStatement() 

            let else_stmt = undefined

            if (this.peek() && this.peek().value == "else"){
                this.getTok()
                else_stmt = this.ParseStatement()
            }

            return new CondNode(cond, stmt, else_stmt)
        }

        else if(this.peek() && this.peek().value == "for"){
            this.getTok()
            this.assert('lparen')

            let init = this.ParseDecl()

            if (! init)
            {
                init = this.ParseExp()
                this.assert('semicolon')
            }

            let test = this.ParseExp()
            this.assert('semicolon')

            let end = new BinOpNode(undefined, undefined, undefined)

            if(this.peek().kind != 'rparen')
                end = this.ParseExp()

            this.assert('rparen')

            let body = this.ParseStatement()
            return new ForNode(init, test, end, body)
        }

        else if(this.peek().value == "break"){
            this.pop()
            let brk =  new BreakNode()
            this.assert('semicolon')
            return brk
        }

        else if(this.peek().value == "continue"){
            this.pop()
            let cnt =  new ContNode()
            this.assert('semicolon')
            return cnt
        }

        else {
            let e =  this.ParseExp()
            this.assert('semicolon')
            return e
        }
    }

    ParseBlockItem(){

        let dec = this.ParseDecl()
        if (dec)
            return dec
        return this.ParseStatement()
    }

    ParseDeclaration(){
        this.assert(undefined, "int")
            
        let nametok = this.assert("id", undefined)
        if(this.peek().value != "("){

            let len = "integer"
            let numtok = undefined

            if (this.peek().kind == "lbrack"){
                this.pop()
                len = Number(this.getTok().value)
                this.assert("rbrack")
            }

            if (this.peek().value == "="){
                this.assert(undefined, "=")
                numtok = this.assert("integer")
            }

            this.assert(undefined, ";")
            return new DeclNode(new VarNode(nametok.value, len), numtok ? new ConstantNode(Number(numtok.value)): undefined)

        }

        // Function arguments

        let args = this.ParseParams()
        this.assert(undefined, "{")

        // Body of the function
        let FunStatements = []

        while(this.peek() && this.peek().value != "}"){
            FunStatements.push(this.ParseBlockItem())
        }
        
        this.assert(undefined, "}")

        // Function Object
        let funobj = new FunctionNode(nametok.value, args, FunStatements)
        
        return funobj
            
    }

    Parse(){
        while(this.peek()){
            this.root.nodes.push(this.ParseDeclaration())
        }

        return this.root
    }

}