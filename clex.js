class Token{
    constructor(kind, val, line){
        this.kind = kind;
        this.value = val;
        this.line = line
        
    }
}

export class Lexer{
    constructor(data){
        this.buf = data
 
        this.pos = 0
        this.line = 1
    }

    // toks is a dict of tokens like or ('id', 'foo') or ...
    toks = {
            'lbrace': /^(\{)/,
            'rbrace': /^(\})/,
            'lparen': /^(\()/,
            'rparen': /^(\))/,
            'lbrack': /^(\[)/,
            'rbrack': /^(\])/,
            'semicolon': /^(;)/,
            'colon':/^(:)/,
            'comma': /^(,)/,
            'qmark':/^(\?)/,

            'integer': /^(\d+)/,
            'id': /^([a-zA-Z0-9][\w_]*)/,

            'le' : /^(<=)/,
            'ge' : /^(>=)/,

            'lt' : /^(<)/,
            'gt' : /^(>)/,
            'equal': /^(==)/,
            'assignment': /^(=)/,
            'ne': /^(!=)/,
            'and':/^(&&)/,
            'or': /^(\|\|)/,
            'minus': /^(-)/,
            'plus': /^(\+)/,
            'mul': /^(\*)/,
            'div': /^(\/)/,
            'mod': /^(%)/,
            'not': /^(~)/,
            'negation': /^(!)/,
            'newline': /^(\n)+/,
            'space': /^([ ]+)/
        }

    keywords = ['int', 'return', 'if', 'else', 'for', 'break', 'continue']

    next(){
        
        if (this.pos >= this.buf.length){
            return null
        }



        for(let k in this.toks){

            let match = this.toks[k].exec(this.buf.slice(this.pos, ))
            if (match) {
                // update pos // return tok // update line num
                
                this.pos += match[1].length

                if(k == 'newline'){
                    this.line += match[1].length
                    return this.next()
                }

                else if(k == 'space'){
                    return this.next()
                }

                if (this.keywords.includes(match[1])){
                    return new Token("keyword", match[1], this.line)
                }

                return new Token(k, match[1],this.line)
            }
        }

        console.log('ERROR. NO TOKEN MATCHED')
        process.exit(1)

    }

}

