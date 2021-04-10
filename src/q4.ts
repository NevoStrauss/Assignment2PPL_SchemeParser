// import { Exp, Program } from '../imp/L3-ast';
import {Result, makeFailure, makeOk} from '../shared/result';
import {
    closureToString, compoundSExpToString,
    isClosure,
    isCompoundSExp,
    isEmptySExp,
    isSymbolSExp,
    Value,
    valueToString
} from "../imp/L3-value";
import {
    Binding, ClassExp,
    isAppExp,
    isBoolExp, isClassExp, isDefineExp,
    isIfExp,
    isLetExp,
    isLitExp,
    isNumExp,
    isPrimOp,
    isProcExp, isProgram,
    isStrExp,
    isVarRef, LetExp, LitExp, ProcExp, unparseL31, VarDecl, Exp, Program, AppExp
} from "./L31-ast";
import {map} from "ramda";
import {isNumber, isString} from "../shared/type-predicates";

// Add a quote for symbols, empty and compound sexp - strings and numbers are not quoted.

const unparseLExps = (les: Exp[], delimiter: string): string =>
    map(l2Topython1, les).join(delimiter);

const unparseProcExp = (pe: ProcExp): string =>
    `(lambda ${map((p: VarDecl) => p.var, pe.args).join(",")} : ${unparseLExps(pe.body, " ")})`

const unparseLetExp = (le: LetExp) : string =>
    `(let (${map((b: Binding) => `(${b.var.var} ${l2Topython1(b.val)})`, le.bindings).join(" ")}) ${unparseLExps(le.body, " ")})`

const unparseClassExp = (ce: ClassExp): string =>
    `(class (${map((f: VarDecl) => f.var, ce.fields).join(" ")}) (${map((b: Binding) => `(${b.var.var} ${l2Topython1(b.val)})`, ce.methods).join(" ")}))`

const valueToStringPython = (val: Value): string =>
    isNumber(val) ?  val.toString() :
        val === true ? 'True' :
            val === false ? 'False' :
                isString(val) ? `"${val}"` :
                                        "";

const unParsePrimPython = (op:string):string =>{
    return op == "eq?" || op == "="? "==" :
        "boolean?"==op ?
            '(lambda x : (type(x) == bool))':
            "number?"==op ?
                '(lambda x : (type(x) == int))' :
                op
}

const unParseAppExp = (app:AppExp):string =>{
    return isPrimOp(app.rator) && app.rator.op!=="not" ?
        `(${map(l2Topython1,app.rands).join(` ${l2Topython1(app.rator)} `)})`:
        isPrimOp(app.rator) ?
        `(${l2Topython1(app.rator)} ${unparseLExps(app.rands, ",")})`:
        `${l2Topython1(app.rator)}(${unparseLExps(app.rands, ",")})`
}

const l2Topython1 = (exp: Exp | Program): string =>
    isBoolExp(exp) ? valueToStringPython(exp.val) :
        isNumExp(exp) ? valueToStringPython(exp.val) :
            isStrExp(exp) ? valueToStringPython(exp.val) :
                isVarRef(exp) ? exp.var :
                    isProcExp(exp) ? unparseProcExp(exp) :
                        isIfExp(exp) ? `(${l2Topython1(exp.then)} if ${l2Topython1(exp.test)} else ${l2Topython1(exp.alt)})` :
                            isAppExp(exp) ? unParseAppExp(exp) :
                                isPrimOp(exp) ? unParsePrimPython(exp.op):
                                    isLetExp(exp) ? unparseLetExp(exp) :
                                        isDefineExp(exp) ? `${exp.var.var} = ${l2Topython1(exp.val)}` :
                                            isProgram(exp) ? `${unparseLExps(exp.exps,"\n")}` :
                                                "";

/*
Purpose: Transform L2 AST to Python program string
Signature: l2ToPython(l2AST)
Type: [EXP | Program] => Result<string>
*/
export const l2ToPython = (exp: Exp | Program): Result<string>  => {
    const str: string = l2Topython1(exp)
    return str === "" ? makeFailure("") : makeOk(str)
}