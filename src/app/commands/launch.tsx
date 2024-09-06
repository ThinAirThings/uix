import { option } from "pastel";
import { TypeOf, z } from "zod";
import React, { useEffect } from "react";
import { Static, Text } from "ink";
import { UixConfigProvider, useUixConfigContext } from "../(v2)/UixConfigProvider";
import { useStore } from "zustand";
import { applicationStorev2 } from "../(v2)/applicationStorev2";
import _ from "lodash";





export const options = z.object({
    config: z.string().optional().describe(
        option({
            description: 'Path to uix.config file',
            alias: 'c',
        })
    ),
})

const InnerComponent = () => {
    const {config} = useUixConfigContext()
    return <Text>{config}</Text>
}

export default function Launch(props:{
    options: TypeOf<typeof options>
}){
    const staticComponentMap = useStore(applicationStorev2, state => state.staticComponentMap)
    const pendingComponentMap = useStore(applicationStorev2, state => state.pendingComponentMap)
    return (<>
        {/* Static Output */}
        <Static items={[...staticComponentMap]}>
            {([key, {Component}]) => <Component key={key} />}
        </Static>
        {/* Pending Output */}
        {[...pendingComponentMap].map(([id, {Component}]) => <Component key={id} />)}
        {/* Program Tree */}
        <UixConfigProvider>
            <InnerComponent />
        </UixConfigProvider>
    </>)
}