/*
 * Copyright (c) 2024.  Botts Innovative Research, Inc.
 * All Rights Reserved
 *
 * opensensorhub/osh-viewer is licensed under the
 *
 * Mozilla Public License 2.0
 * Permissions of this weak copyleft license are conditioned on making available source code of licensed
 * files and modifications of those files under the same license (or in certain cases, one of the GNU licenses).
 * Copyright and license notices must be preserved. Contributors provide an express grant of patent rights.
 * However, a larger work using the licensed work may be distributed under different terms and without
 * source code for files added in the larger work.
 *
 */

import {IconButton, Table, TableBody, TableCell, TableRow, Tooltip} from "@mui/material";
import {History} from "@mui/icons-material";
import React from "react";

interface IRealTimeControlsProps {

    switchToPlayback: () => void;
}

const RealTimeControls = (props: IRealTimeControlsProps) => {

    return (
        <Table style={{alignContent: "center", margin: "0em 1em 0em 1em"}}>
            <TableBody>
                <TableRow>
                    <TableCell>
                        <Tooltip title={"Replay"} placement={"top"}>
                            <IconButton color={"primary"} onClick={props.switchToPlayback}>
                                <History/>
                            </IconButton>
                        </Tooltip>
                    </TableCell>
                    <TableCell>
                        LIVE
                    </TableCell>
                </TableRow>
            </TableBody>
        </Table>
    );
}

export default RealTimeControls;