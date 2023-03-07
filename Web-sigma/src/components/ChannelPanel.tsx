import React, { FC, useEffect, useState } from "react";
import { useRegisterEvents, useSigma } from '@react-sigma/core';
import Panel from "./Panel";

const ChannelPanel: FC<{
    channel: string
}> = ({ channel }) => {
    const sigma = useSigma();
    const graph = sigma.getGraph();

    const [ edgeCount, setEdgeCount ] = useState(0);
    var emptyNodeArr: string[] = [];
    const [neighbors, setNeighbors] = useState(emptyNodeArr);

    useEffect(() => {
        populateData();
    }, [channel]);

    function populateData(){
        var numEdges = 0;
        var nodeArr: string[] = [];
        graph.forEachNeighbor(channel, (neighbor) => {
            numEdges += 1;
            nodeArr.push(neighbor);
        })
        setEdgeCount(numEdges);
        setNeighbors(nodeArr);
    }

    return (
        <Panel
            initiallyDeployed={true}
            title={
                <>
                    {channel}
                </>
            }
        >
            <p>
                modularity_class: {graph.getNodeAttribute(channel, "cluster")}
            </p>
            <p>
                Neighbors: {edgeCount}
            </p>
            <ul>
                {neighbors.map((neighbor) => {
                    return (
                        <li>
                            {graph.getNodeAttribute(neighbor, "originalLabel")}
                        </li>
                    )
                })}
            </ul>
        </Panel>
    );
};

export default ChannelPanel;
