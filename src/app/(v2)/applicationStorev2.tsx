import { FC } from "react";
import { createImmerState } from "../(utilities)/createImmerState";
import { Box, Newline, Text } from "ink";
import Gradient from "ink-gradient";
import BigText from "ink-big-text";
import React from "react";


export const applicationStorev2 = createImmerState({
    staticComponentMap: new Map<string, {
        Component: FC,
    }>([['header', {
        Component: () => (
            <Box flexDirection="column">
                <Gradient name='rainbow'>
                    <BigText text='Uix' font='3d' />
                </Gradient>
                <Text>Uix Graph System 🔥 by 🐰 Thin Air </Text>
                <Newline />
            </Box>
        )
    }]]),
    pendingComponentMap: new Map<string, {
        Component: FC
    }>(),
    complete: false as boolean,
})

applicationStorev2.subscribe(
    state => state.complete,
    async complete => {
        await new Promise(resolve => setTimeout(resolve, 2000))
        if (complete) {
            process.exit(0)
        }
    }
)