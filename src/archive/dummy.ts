



type TupleSplit<T, N extends number, O extends readonly any[] = readonly []> =
    O['length'] extends N ? [O, T] : T extends readonly [infer F, ...infer R] ?
    TupleSplit<readonly [...R], N, readonly [...O, F]> : [O, T]

type TakeFirst<T extends readonly any[], N extends number> =
    TupleSplit<T, N>[0];

type SkipFirst<T extends readonly any[], N extends number> =
    TupleSplit<T, N>[1];

type TupleSlice<T extends readonly any[], S extends number, E extends number> =
    SkipFirst<TakeFirst<T, E>, S>

class TypeSpread<This extends readonly [
    string,
    Record<string, any>
]> {
    type: This[0]
    props: This[1]
    constructor(
        type: This[0],
        props: This[1]
    ) {
        this.type = type
        this.props = props
    }
    setType = <
        Type extends string
    >(
        type: Type
    ) => new TypeSpread<[...[Type, ...TupleSlice<This, 1, 2>]]>(
        type,
        this.props
    )
}


type Thing = ['Hello', {
    thing: 5
}, 3, 4]
type Thing2 = TupleSlice<Thing, 1, 2>

const thing = new TypeSpread<[...['fdsa', ...TupleSlice<Thing, 1, 2>]]>(
    'fdsa',
    {
        thing: 5
    }
)


