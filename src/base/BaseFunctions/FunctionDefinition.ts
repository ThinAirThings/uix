import { ZodObject, z } from "zod";


//  _   _ _   _ _ _ _          _____                  
// | | | | |_(_) (_) |_ _  _  |_   _|  _ _ __  ___ ___
// | |_| |  _| | | |  _| || |   | || || | '_ \/ -_|_-<
//  \___/ \__|_|_|_|\__|\_, |   |_| \_, | .__/\___/__/
//                      |__/        |__/|_|    
export type CamelCase = `${Lowercase<string>}${string}`
//  ___       __ _      _ _   _          
// |   \ ___ / _(_)_ _ (_) |_(_)___ _ _  
// | |) / -_)  _| | ' \| |  _| / _ \ ' \ 
// |___/\___|_| |_|_||_|_|\__|_\___/_||_| 
export class FunctionDefinition<
    FunctionType extends CamelCase = CamelCase,
    InputSchema extends ZodObject<any> | undefined = undefined,
    OutputSchema extends ZodObject<any> | undefined = undefined,
> {
    //      ___             _               _           
    //     / __|___ _ _  __| |_ _ _ _  _ __| |_ ___ _ _ 
    //    | (__/ _ \ ' \(_-<  _| '_| || / _|  _/ _ \ '_|
    //     \___\___/_||_/__/\__|_|  \_,_\__|\__\___/_|  
    private constructor(
        public functionType: FunctionType,
        public inputSchema: InputSchema = undefined as InputSchema,
        public outputSchema: OutputSchema = undefined as OutputSchema
    ) { }
}


const createNodeSignature = z
    .function()
    .args(z.enum(['Hello', 'Cheese'])) // accepts an arbitrary number of arguments
    //   .returns(z.string())
    .implement((x) => {
        if (x === 'Hello') {
            return 'fdsfdsa'
        } else {
            return 10
        }
        // // TypeScript knows x is a string!
        // return x.trim().length;
    });

const val = createNodeSignature('Hello'); // => 8
const val2 = createNodeSignature('Cheese'); // => 4