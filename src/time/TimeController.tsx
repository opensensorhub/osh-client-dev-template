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

import React, {useEffect, useState} from "react";
import * as noUiSlider from 'nouislider';
import {API, PipsMode} from 'nouislider';
import 'nouislider/dist/nouislider.min.css';
import {Box} from "@mui/material";
import PlaybackTimeControls from "./PlaybackTimeControls";
import RealTimeControls from "./RealTimeControls";
// @ts-ignore
import * as wNumb from 'wnumb';
// @ts-ignore
import DataSynchronizer from "osh-js/source/core/timesync/DataSynchronizer"
// @ts-ignore
import {EventType} from "osh-js/source/core/event/EventType";
// @ts-ignore
import {Mode} from "osh-js/source/core/datasource/Mode";


interface ITimeControllerProps {

    style?: React.CSSProperties,
    dataSynchronizer: DataSynchronizer,
    startTime: number,
    endTime: number,
}

let sliderApi: API;

const TimeController = (props: ITimeControllerProps) => {


    let [currentTime, setCurrentTime] = useState<number>(0);
    let [inPlaybackMode, setInPlaybackMode] = useState<boolean>(true);
    let [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
    let [playbackState, setPlaybackState] = useState<string>("PAUSE");

    useEffect(() => {

        let sliderContainer = document.getElementById('TimeController');

        sliderApi = noUiSlider.create(sliderContainer, {
            start: props.startTime,
            range: {
                min: props.startTime,
                max: props.endTime
            },
            format: wNumb({
                decimals: 0
            }),
            behaviour: 'drag',
            connect: true,
            animate: false,
            pips: {
                mode: PipsMode.Positions,
                // values: [10, 25, 50, 75, 90],
                values: [20, 50, 80],
                density: 1,
                format: wNumb({
                    edit: function (value: string) {
                        return new Date(parseInt(value)).toISOString().replace(".000Z", "Z")
                            .replace("T", " T ")
                    }
                })
            },
        });

        sliderApi.on('update', updateCurrentTime);

        props.dataSynchronizer.subscribe((message: { type: any; timestamp: any; }) => {

            if (message.type === EventType.LAST_TIME) {

                if (sliderApi) {

                    sliderApi.updateOptions(
                        {
                            start: message.timestamp,
                        },
                        false // Boolean 'fireSetEvent'
                    );
                }

                setCurrentTime(message.timestamp);
            }

        }, [EventType.LAST_TIME])

    }, []);

    useEffect(() => {

        if (!inPlaybackMode) {

            document.getElementById('TimeController').setAttribute('disabled', 'true');

        } else {

            if (sliderApi) {

                sliderApi.updateOptions(
                    {
                        start: props.startTime,
                        range: {
                            min: props.startTime,
                            max: props.endTime
                        }
                    },
                    false // Boolean 'fireSetEvent'
                );
            }

            setCurrentTime(0);

            document.getElementById('TimeController').removeAttribute('disabled');
        }

    }, [inPlaybackMode]);

    const disconnect = async (dataSynchronizer: DataSynchronizer) => {

        await dataSynchronizer.disconnect();
        return dataSynchronizer;
    }

    const updateCurrentTime = (values: string[]) => {

        setCurrentTime(Number(values[0]));
    }

    const updateSpeed = async function (dataSynchronizer: DataSynchronizer, speed: number) {

        await dataSynchronizer.setReplaySpeed(speed);
    }

    const setMode = async (dataSynchronizer: DataSynchronizer, mode: Mode) => {

        await dataSynchronizer.setMode(mode);
        return dataSynchronizer;
    }

    const slowDown = () => {

        let newSpeed = (playbackSpeed - 0.25) > 0.25 ? (playbackSpeed - 0.25) : 0.25;

        updateSpeed(props.dataSynchronizer, newSpeed).then();

        setPlaybackSpeed(newSpeed);
    }

    const speedUp = () => {

        let newSpeed = (playbackSpeed + 0.25) < 10 ? (playbackSpeed + 0.25) : 10;

        updateSpeed(props.dataSynchronizer, newSpeed).then();

        setPlaybackSpeed(newSpeed);
    }

    const togglePlaybackMode = () => {
        disconnect(props.dataSynchronizer)
            .then(dataSynchronizer => {

                if (inPlaybackMode) {

                    setMode(dataSynchronizer, Mode.REAL_TIME)
                        .then(async (dataSynchronizer) => {

                            await dataSynchronizer.connect();
                        });

                } else {

                    setMode(dataSynchronizer, Mode.REPLAY)
                        .then(dataSynchronizer => {
                        });
                }

                setInPlaybackMode(!inPlaybackMode);
            });
    }

    const pause = () => {

        setPlaybackState("PAUSE");

        props.dataSynchronizer.disconnect().then();
    }

    const updateTimeRange = async (dataSynchronizer: DataSynchronizer, time: number, speed: number) => {

        for (let dataSource of dataSynchronizer.getDataSources()) {

            dataSource.setMinTime(new Date(time).toISOString());
        }

        await dataSynchronizer.setTimeRange(new Date(time).toISOString(), props.endTime, speed, false);
    }

    const start = () => {

        // Ensure all data sources are using playback time period
        if (inPlaybackMode) {

            setPlaybackState("PLAY");

            updateTimeRange(props.dataSynchronizer, currentTime, playbackSpeed).then();
        }

        props.dataSynchronizer.connect().then();
    }

    const skip = (seconds: number) => {

        let adjustedTime: number = currentTime + seconds * 1000;

        if (sliderApi) {

            sliderApi.updateOptions(
                {
                    start: adjustedTime,
                },
                false // Boolean 'fireSetEvent'
            );
        }

        setCurrentTime(adjustedTime);

        updateTimeRange(props.dataSynchronizer, adjustedTime, playbackSpeed).then();
    }

    return (
        <Box>
            <Box id="TimeController"
                 style={{
                     height: '1vh',
                     position: 'relative',
                     background: 'transparent',
                     margin: "0em 1em 0em 1em", ...props.style
                 }}/>
            <Box style={{height: '4vh', position: 'absolute', bottom: '2vh', margin: '.5em'}}>
                {inPlaybackMode ?
                    <PlaybackTimeControls currentTime={currentTime}
                                          startTime={props.startTime}
                                          endTime={props.endTime}
                                          playbackState={playbackState}
                                          playbackSpeed={playbackSpeed}
                                          connected={props.dataSynchronizer.isConnected()}
                                          switchToRealtime={togglePlaybackMode}
                                          start={start}
                                          pause={pause}
                                          skip={skip}
                                          speedUp={speedUp}
                                          slowDown={slowDown}/>
                    : <RealTimeControls switchToPlayback={togglePlaybackMode}/>
                }
            </Box>
        </Box>
    );
}

export default TimeController;