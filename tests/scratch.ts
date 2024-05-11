


const defineSignature = <
    ImplementationSignature extends (...args: any[]) => any,
    GenericSignature extends (
        implementationSignature: ImplementationSignature
    ) => (...args: any[]) => any
>(
    implementationSignature: ImplementationSignature,
    genericSignature: GenericSignature
): GenericSignature => genericSignature


const genericSignature = defineSignature(
    (a: number, b: number) => a + b,
    (implementationSignature) => (
        ...args: Parameters<typeof implementationSignature>
    ) => implementationSignature(...args)
)