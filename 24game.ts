type S<T extends Nat, U = (x: any, ...args: T) => void> = U extends (...args: infer P) => void ? P : never
type Nat = any[]

type NatToNumber<T extends Nat> = T["length"]

type NumberToNatHelper<T extends number, N extends Nat> = {
    "equal": N
    "not equal": NumberToNatHelper<T, S<N>>
}[If<Equal<N["length"], T>, "equal", "not equal">]

type NumberToNat<T extends number> = NumberToNatHelper<T, []>
type Nat5 = NumberToNat<5> // [any, any, any, any, any]
type Number5 = NatToNumber<Nat5> // 5

type NumToNumber<T extends Num> = NumToNumberHelper<T, []>
type NumToNumberHelper<N extends Num, Na extends Nat> = {
    "Zero": Na["length"]
    "Num": NumToNumberHelper<Pre<N>, S<Na>>
}[If<IsZero<N>, "Zero", "Num">]

type NumberToNum<T extends number> = NumberToNumHelper<T, [], Zero>
type NumberToNumHelper<T extends number, N extends Nat, R extends Num> = {
    "equal": R
    "not equal": NumberToNumHelper<T, S<N>, Succ<R>>
}[If<Equal<N["length"], T>, "equal", "not equal">]

type Zero = {
    isZero: true
}

type Num = Zero | { pre: Num, isZero: false }

type Succ<T extends Num> = {
    pre: T,
    isZero: false
}

// 3.0 之后写法
type Pre<T extends Num> = T extends Succ<infer R> ? R : Zero

// 3.0 之前写法（暂时用之前的写法）
interface Table {
    0: Zero,
    1: Succ<this[0]>
    2: Succ<this[1]>
    3: Succ<this[2]>
    4: Succ<this[3]>
    5: Succ<this[4]>
    6: Succ<this[5]>
    7: Succ<this[6]>
    8: Succ<this[7]>
    9: Succ<this[8]>
}

type FromNumber<T extends number> = (Table & { [k: number]: never })[T]

type _0 = FromNumber<0>
type _1 = FromNumber<1>
type _2 = FromNumber<2>
type _3 = FromNumber<3>
type _4 = FromNumber<4>
type _5 = FromNumber<5>
type _6 = FromNumber<6>
type _7 = FromNumber<7>
type _8 = FromNumber<8>
type _9 = FromNumber<9>

/**
 * 创建是否相等类型
 */
// type Equal<A, B> = A extends B ? B extends A ? true : false : false
/**
 * 上面这样写会出现下面的问题。
 */
// type TestNever = Equal<never, number> // -> `never`
/**
 * 并不符合预期，可以先理解为一个 ts bug。所需需要在外面包一层括号
 */
type Equal<A, B> = [A] extends [B] ? [B] extends [A] ? true : false : false
/** test */
// type TestNever = Equal<never,number> // -> `false`

/**
 * 但是很快就会发现一个问题，ts 对于对象的 extends 判断，最高只支持 5 层，也就是说如果对象超过 5 层，那么 5 层之后就会直接忽略，判断为符合。
 * 下面是表现。注意：两个结果必须分开看。也就是说看一个结果的时候需要把另一个注释掉，因为 ts 会做缓存。两个表达式的结果会互相影响。
 */
/** test */
// type A5 = Equal<_5, _6> // true
// type B5 = Equal<_4,_5>// false
// 所以 Equal 函数对 Num 类型是不起作用的，所以下面只会使用 Equal 来比较非深层对象的类型。

/**
 * 分支函数
 * 给定一个条件变量。
 * 当条件变量为 true 的时候返回一个值，当条件变量为 false 的时候返回另一个值。 
 */
type If<Cond, A, B> = Equal<Cond, true> extends true ? A : B
/**
 * 当且仅当 Cond 为 true 的时候，返回 A，否则返回 B
 */
/** test */
// type IfTest = If<true, 1, 2> // 1
// type IfTest1 = If<false, 1, 2> // 1

/** 逻辑运算 */
type ToBoolean<A> = If<A, true, false>
type And<A, B> = If<A, ToBoolean<B>, false>
type Or<A, B> = If<A, true, ToBoolean<B>>

/**
 * 判断类型
 */
type IsZero<T> = Equal<T, Zero>
type IsNever<T> = Equal<T, never>

/** 使用递归去壳 */
type UnarrayCorrect<T> = {
    isArray: T extends Array<infer R> ? UnarrayCorrect<R> : never,
    no: T    
}[T extends any[] ? "isArray" : "no"]

/** 四则运算 */

/** 
 * 加法 
 * 对于 A + B
 * 如果 A 是 0，那么返回 B
 * 如果 B 是 0，那么返回 A
 * 如果都不是 0，那么给第一个操作数 -1 ，递归调用加法，再对结果 + 1
 * 意思就是 0 + B = B 且 A + B = (A - 1) + (B + 1)
 */
type Add<A extends Num, B extends Num> = {
    "A is Zero": B,
    "B is Zero": A,
    "no Zero": Succ<Add<Pre<A>, Succ<B>>>
}[If<IsZero<A>, "A is Zero", If<IsZero<B>, "B is Zero", "no Zero">>]

/**
 * 减法
 * 对于 A - B
 * 如果 B 是 0，那么返回 A
 * 如果 A 是 0，且 B 不是 0 ，那么返回 never
 * 如果都不是 0，那么两个操作数各自 - 1，再递归调用。
 * 意思就是 A - 0 = A 且 A - B = (A - 1) - (B - 1)
 */
type Sub<A extends Num, B extends Num> = {
    "A is Zero": never,
    "B is Zero": A,
    "no Zero": Sub<Pre<A>, Pre<B>>
}[If<IsZero<B>, "B is Zero", If<IsZero<A>, "A is Zero", "no Zero">>]

type _7_2 = Sub<FromNumber<5>, FromNumber<5>>

/**
 * 乘法
 * 乘法依靠加法来实现
 * 对 A * B
 * 对于 A 是 0，那么返回 B
 * 对于 B 是 0，那么返回 0
 * 如果没有 0，给 A 减去 1，然后返回 B 加上 (A - 1) * B
 * 也就是说 0 * B = 0 且 A * B = B + (A - 1) * B
 */

// type Mult<A extends Num, B extends Num, R extends Num = Zero> = {
//     "has Zero": R,
//     "no Zero": Mult<Pre<A>, B, Add<B, R>>
// }[If<Or<IsZero<A>, IsZero<B>>, "has Zero", "no Zero">]

// type Mult<A extends Num, B extends Num> = MultHelper<A, B, Zero>

// type MultHelper<A extends Num, B extends Num, R extends Num> = {
//     "Has Zero": R
//     "No Zero": MultHelper<Pre<A>, B, Add<B, R>> 
// }[If<Or<IsZero<A>, IsZero<B>>, "Has Zero", "No Zero">]

type Mult<A extends Num, B extends Num, R extends Num = Zero> = {
    "Has Zero": R
    "No Zero": Mult<Pre<A>, B, Add<B, R>> 
}[If<Or<IsZero<A>, IsZero<B>>, "Has Zero", "No Zero">]

type _81 = Mult<_2, _4>

/** 
 * 除法
 * 如果 A = 0，那么返回 never
 * 如果 B = 0, 也返回 never
 * 如果 A !== 0 且 B !== 0 ，A / B =,
 */

 type Div<A extends Num, B extends Num> = DivHelper<A, B, B, Zero>

 type DivHelper<A extends Num, B extends Num, S extends Num, R extends Num> = {
    "A0S0": Succ<R>
    "A0S+": never
    "A+S0": DivHelper<A, B, B, Succ<R>>
    "A+S+": DivHelper<Pre<A>, B, Pre<S>, R>
 }[If<IsZero<A>, If<IsZero<S>, "A0S0", "A0S+">, If<IsZero<S>, "A+S0", "A+S+">>]

type s = Div<FromNumber<8>, FromNumber<4>>

// 下面是步骤解析 
// 首先走进 `A+S+`
// DivHelper<8, 4, 4, 0>
// DivHelper<7, 4, 3, 0>
// DivHelper<6, 4, 2, 0>
// DivHelper<5, 4, 1, 0>
// DivHelper<4, 4, 0, 0>
// 注意此时发生变化，走进 `A+S0`
// DivHelper<4, 4, 4, 1>
// DivHelper<3, 4, 3, 1>
// DivHelper<2, 4, 2, 1>
// DivHelper<1, 4, 1, 1>
// DivHelper<0, 4, 0, 2>
// 最后就是 Succ<1> 也就是 2

// 也可以写成下面这种，可读性比较高
type DivHelper2<A extends Num, B extends Num, S extends Num = Zero, R extends Num = Zero> = {
    "A is Zero": {
        "S is Zero": Succ<R>
        "S is not Zero": never 
    }[If<IsZero<S>, "S is Zero", "S is not Zero">]
    "A is not Zero": {
        "S is Zero": DivHelper<A, B, B, Succ<R>>,
        "S is not Zero": DivHelper<Pre<A>, B, Pre<S>, R>
    }[If<IsZero<S>, "S is Zero", "S is not Zero">]
}[If<IsZero<A>, "A is Zero", "A is not Zero">]


type _9_3 = DivHelper2<FromNumber<9>, FromNumber<3>>
