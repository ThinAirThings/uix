import { Box, Text } from "ink";
import { ReactNode } from "react";
import React from "react";



export const Success = ({children}:{children: ReactNode}) => {
    return (
        <Box>
            <Text>✅</Text>
            {children}
        </Box>
    )
}