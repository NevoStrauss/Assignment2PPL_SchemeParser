import {
    ClassExp,
    ProcExp,
    Exp,
    Program,
    VarDecl,
    Binding,
    makeProcExp,
    CExp,
    IfExp,
    makeIfExp,
    makeVarDecl,
    makeAppExp,
    makePrimOp,
    makeVarRef,
    makeStrExp,
    makeBoolExp,
    isProgram,
    isExp,
    makeProgram,
    isClassExp,
    makeLitExp,
    isProcExp,
    isLetExp,
    makeLetExp,
    isDefineExp,
    isAtomicExp,
    isCompoundExp,
    CompoundExp,
    isCExp,
    isAppExp,
    isIfExp, isBinding, isLitExp, makeBinding, makeDefineExp
} from "./L31-ast";
import {Result, makeFailure, makeOk} from "../shared/result";
import {concat, is, map} from "ramda";
import {isArray} from "../shared/type-predicates";
import {allT} from "../shared/list";
import {CompoundSExp, isClosure, isCompoundSExp, makeClosure, makeCompoundSExp, SExpValue} from "../imp/L3-value";
import {Sexp} from "s-expression";
import exp from "node:constants";

/*
Purpose: Transform ClassExp to ProcExp
Signature: for2proc(classExp)
Type: ClassExp => ProcExp
*/
const concatIf = (methods:Binding[]):IfExp=>{
    return methods.length===1 ? makeIfExp(makeAppExp(makePrimOp("eq?"),
        [makeVarRef("msg"),makeLitExp("'".concat(methods[0].var.var))]),
        makeAppExp(methods[0].val,[]), makeBoolExp(false)) :
        makeIfExp(makeAppExp(makePrimOp("eq?"),
            [makeVarRef("msg"),makeLitExp("'".concat(methods[0].var.var))]),
            makeAppExp(methods[0].val,[]),
            concatIf(methods.slice(1)))
}

export const class2proc = (exp: ClassExp): ProcExp =>{
    return makeProcExp(exp.fields, [makeProcExp([makeVarDecl("msg")],[concatIf(exp.methods)])])
}

const handleCompoundExp = (exp: CompoundExp): CompoundExp =>{
    return isAppExp(exp) ?
        makeAppExp(handleCExp(exp.rator),map((e)=>handleCExp(e),exp.rands)) :
        isProcExp(exp) ?
           makeProcExp(exp.args,map((e)=>handleCExp(e),exp.body)) :
            isIfExp(exp) ?
                makeIfExp(handleCExp(exp.test),handleCExp(exp.then),handleCExp(exp.alt)):
                    isLetExp(exp) ?
                        makeLetExp(map((b)=>makeBinding(b.var.var,handleCExp(b.val)),exp.bindings),map((b)=>handleCExp(b),exp.body)):
                        isLitExp(exp) ?
                        exp :
                        isClassExp(exp) ?
                            class2proc(exp) :
                            exp

}

const handleCExp = (exp: CExp): CExp=>{
    return isAtomicExp(exp) ?
        exp :
        isCompoundExp(exp) ?
            handleCompoundExp(exp) :
            exp;

}

const handleExp = (exp: Exp): Exp =>{
    return isDefineExp(exp) ?
            makeDefineExp(exp.var,handleCExp(exp.val)) :
            isCExp(exp) ?
            handleCExp(exp) :
                exp
}

/*
Purpose: Transform L31 AST to L3 AST
Signature: l31ToL3(l31AST)
Type: [Exp | Program] => Result<Exp | Program>
*/
export const L31ToL3 = (exp: Exp | Program): Result<Exp | Program> => {
    return isProgram(exp) ?
                makeOk(makeProgram(map((exp:Exp)=>handleExp(exp), exp.exps))):
                    isExp(exp) ?
                        makeOk(handleExp(exp)) :
                        makeFailure("nevo");
}