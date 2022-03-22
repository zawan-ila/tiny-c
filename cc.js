import {Lexer} from "./clex.js"
import {Parser} from './cpars.js'
import { CodeGenerator } from "./cgen.js"

import * as fs from 'fs'

try{
    var data = fs.readFileSync(process.argv[2], 'ascii')
}
catch(err){
    console.log('Errror reading file')
}

var l = new Lexer(data)
var t = l.next()
var all_toks = []

while (t){
    all_toks.push(t)
    t = l.next()
}


// -----------------------------------

var parser = new Parser(all_toks)

let res = parser.Parse()

// console.log('Parsing success')
// console.log(res.nodes.length)

// for (var c of res.nodes){
//     pp(c)
// }

// // -----------------------------------

let cgen = new CodeGenerator(res)

let asm = cgen.Generate()

console.log(asm)


function pp(obj, idnt = 0){

    switch(obj.__proto__.constructor.name){
        case 'FunctionNode':
            pf(obj, idnt)
            break
        case 'ReturnNode':
            pr(obj, idnt)
            break
        case 'BinOpNode':
            pe(obj, idnt)
            break

        case 'ConstantNode':
            pc(obj, idnt)
            break

        case 'UnaryNode':
            pu(obj, idnt)
            break

        case 'DeclNode':
            pd(obj, idnt)
            break
        
        case 'VarNode':
            pv(obj, idnt)
            break

        case 'AssignmentNode':
            pa(obj, idnt)
            break

        case 'CondNode':
            // console.log('FFF')
            pcond(obj, idnt)
            break
        case 'CondExpNode':
            // console.log('GGG')
            pcondexp(obj, idnt)
            break
        case 'CompoundStatementNode':
            console.log(" ".repeat(idnt) + 'COMPOUND STATEMENTS BEGIN')
            for (let s of obj.statements)
                pp(s, idnt + 1)
            console.log(" ".repeat(idnt) + 'COMPOUND END')
            break

        case 'ForNode':
            console.log(" ".repeat(idnt) + 'PRE')
            pp(obj.pre_exp, idnt + 1)
            console.log(" ".repeat(idnt) + 'TEST')
            pp(obj.test_exp, idnt + 1)
            console.log(" ".repeat(idnt) + 'POST')
            pp(obj.post_exp, idnt + 1)
            console.log(" ".repeat(idnt) + 'BOD')
            pp(obj.body, idnt + 1)
            break

        case 'BreakNode':
            console.log(" ".repeat(idnt) + 'BREAK')
            break
        
        case 'ContNode':
            console.log(" ".repeat(idnt) + 'CONTINUE')
            break

        case 'FunCallNode':
            console.log(" ".repeat(idnt) + "Call", obj.name)
            console.log(" ".repeat(idnt) + 'Args begin')
            for (let c of obj.args)
                pp(c, idnt + 1)
            console.log(" ".repeat(idnt) + 'Args end')
            break
        
            
        default:
            console.log('Error? Can not Print AST? ')
            process.exit(1)
            

    }
}

function pcondexp(e, idnt = 0){
    console.log(" ".repeat(idnt) + "CondExpNode")

    pe(e.cond, idnt + 1)
    
    if (e.if){
        console.log(" ".repeat(idnt) + "If Part")
        pe(e.if, idnt + 1)
        console.log(" ".repeat(idnt) + "else part")
        pp(e.else, idnt + 1)
    }



}

function pcond(cond_n, idnt = 0){

    // console.log("IF STATEMENT FOUND")
    console.log(" ".repeat(idnt) + "IF Statement")
    pe(cond_n.cond, idnt + 1)

    pp(cond_n.if, idnt + 1)
    if (cond_n.else){
        pp(cond_n.else, idnt + 1)
    }

    console.log('PCOND DONE')
}

function pu(un, idnt = 0){

    // print unary node
    console.log(" ".repeat(idnt) + "Unary Node")
    console.log(" ".repeat(idnt) + un.op)
    pe(un.operand, idnt + 1)
    return

}

function pe(en, idnt = 0){
    // print expression node
    
    // console.log("DEb", en)
    if(en.__proto__.constructor.name == "ConstantNode"){
        pc(en, idnt)
        return
    }

    else if(en.__proto__.constructor.name == "UnaryNode"){
        pu(en, idnt)
        return
    }

    else if(en.__proto__.constructor.name == "VarNode"){
        pv(en, idnt)
        return
    }

    else if(en.__proto__.constructor.name == "AssignmentNode"){
        pa(en, idnt)
        return
    }

    else if(en.__proto__.constructor.name == "CondExpNode"){
        pcondexp(en, idnt)
        return
    }


    else if(en.__proto__.constructor.name == "FunCallNode"){
        pp(en, idnt)
        return
    }

    else if(en.op === undefined){
        console.log(" ".repeat(idnt) + 'Empty statement?')
        return
    }


    console.log(" ".repeat(idnt) + en.op)


    pe(en.left, idnt + 1)

    pe(en.right, idnt + 1)


}

function pr(sn, idnt = 0){

    // print statement(return) node
    console.log(" ".repeat(idnt) + "Return Node")
    // console.log(sn.exp)
    pe(sn.exp, idnt + 1)

}

function pf(fn, idnt = 0){

    // print function node

    console.log(" ".repeat(idnt) + "Function Name:", fn.name)
    console.log(" ".repeat(idnt) + "Args: ", fn.args)
    for(let s of fn.nodes){
        pp(s, idnt + 1)
    }
}

function pc(obj, idnt = 0){
    // print constant node
    console.log(" ".repeat(idnt) + obj.num)
}

function pa(obj, idnt = 0){
    // print assignment node
    console.log(" ".repeat(idnt) + obj.op)
    pv(obj.left, idnt + 1)
    pe(obj.right, idnt + 1)
}

function pv(obj, idnt = 0){
    // print var node
    // console.log('ABOVE')
    console.log(" ".repeat(idnt) + obj.id)
    console.log(" ".repeat(idnt), obj.type)
}

function pd(obj, idnt = 0){
    // print decl node
    
    // console.log(" ".repeat(idnt) + obj.left)
    pv(obj.left, idnt)
    if (! obj.right)
        console.log(" ".repeat(idnt) + "undefined")
    else
        pe(obj.right, idnt)
}
