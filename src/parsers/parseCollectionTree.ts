import { CollectOptions } from "../types/RelationshipCollectionMap"

// _____                 ___       __ _      _ _   _             
// |_   _|  _ _ __  ___  |   \ ___ / _(_)_ _ (_) |_(_)___ _ _  ___
//   | || || | '_ \/ -_) | |) / -_)  _| | ' \| |  _| / _ \ ' \(_-<
//   |_| \_, | .__/\___| |___/\___|_| |_|_||_|_|\__|_\___/_||_/__/
//       |__/|_|  

                                       
type RelationshipNode = {
    to: DirectionNode
} | {
    from: DirectionNode
}

type DirectionNode = {
    options?: CollectOptions
    relatedBy?: {
        [relationshipType: string]: RelationshipNode
    }
}
