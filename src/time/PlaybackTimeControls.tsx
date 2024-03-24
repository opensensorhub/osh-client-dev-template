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

import {Chip, IconButton, Table, TableBody, TableCell, TableRow, Tooltip} from "@mui/material";
import {
    AddCircleOutline,
    FastForward,
    FastRewind,
    Pause,
    PlayArrow,
    RemoveCircleOutline,
    Schedule
} from "@mui/icons-material";
import React from "react";

interface IPlaybackTimeControlsProps {

    startTime: number,
    endTime: number,
    currentTime: number,
    playbackState: string,
    playbackSpeed: number,
    connected: boolean,
    switchToRealtime: () => void,
    slowDown: () => void,
    speedUp: () => void,
    pause: () => void,
    start: () => void,
    skip: (seconds: number) => void
}

const PlaybackTimeControls = (props: IPlaybackTimeControlsProps) => {

    return (
        <Table style={{alignContent: "center", margin: "0em 1em 0em 1em"}}>
            <TableBody>
                <TableRow>
                    <TableCell>
                        <IconButton disabled={props.playbackState === "PLAY"} color={"primary"}
                                    onClick={props.switchToRealtime}>
                            <Tooltip title={"Live"} placement={"top"}>
                                <Schedule/>
                            </Tooltip>
                        </IconButton>
                    </TableCell>
                    <TableCell>
                        <IconButton disabled={props.playbackState === "PLAY"} color={"primary"}
                                    onClick={props.slowDown}>
                            <Tooltip title={"Slow Down"} placement={"top"}>
                                <RemoveCircleOutline/>
                            </Tooltip>
                        </IconButton>
                        <Chip style={{width: '5em'}} label={props.playbackSpeed + "x"}/>
                        <IconButton disabled={props.playbackState === "PLAY"} color={"primary"}
                                    onClick={props.speedUp}>
                            <Tooltip title={"Speed Up"} placement={"top"}>
                                <AddCircleOutline/>
                            </Tooltip>
                        </IconButton>
                    </TableCell>
                    <TableCell>
                        <IconButton disabled={props.playbackState === "PLAY"} color={"primary"}
                                    onClick={() => {
                                        props.skip(-10);
                                    }}>
                            <Tooltip title={"Rewind 10s"} placement={"top"}>
                                <FastRewind/>
                            </Tooltip>
                        </IconButton>
                        {props.playbackState === "PAUSE" ?
                            <IconButton disabled={!props.connected}
                                        color={"primary"} onClick={props.start}>
                                <Tooltip title={"Play"} placement={"top"}>
                                    <PlayArrow/>
                                </Tooltip>
                            </IconButton>
                            :
                            <IconButton color={"primary"} onClick={props.pause}>
                                <Tooltip title={"Pause"} placement={"top"}>
                                    <Pause/>
                                </Tooltip>
                            </IconButton>
                        }
                        <IconButton disabled={props.playbackState == "PLAY"} color={"primary"}
                                    onClick={() => {
                                        props.skip(10);
                                    }}>
                            <Tooltip title={"Forward 10s"} placement={"top"}>
                                <FastForward/>
                            </Tooltip>
                        </IconButton>
                    </TableCell>
                    <TableCell>
                        Start Time:
                    </TableCell>
                    <TableCell>
                        {new Date(props.startTime).toISOString()}
                    </TableCell>
                    <TableCell>
                        Current Time:
                    </TableCell>
                    <TableCell>
                        {props.currentTime == 0 ? '----/--/--T--:--:--Z' : new Date(props.currentTime).toISOString()}
                    </TableCell>
                    <TableCell>
                        End Time:
                    </TableCell>
                    <TableCell>
                        {new Date(props.endTime).toISOString()}
                    </TableCell>
                </TableRow>
            </TableBody>
        </Table>
    );
}

export default PlaybackTimeControls;