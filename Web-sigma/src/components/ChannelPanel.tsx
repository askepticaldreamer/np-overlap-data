import React, { FC, useEffect, useState } from "react";
import { useRegisterEvents, useSigma } from '@react-sigma/core';
import Panel from "./Panel";
import { FiltersState } from "../types";
import { BsTv } from "react-icons/bs";

const ChannelPanel: FC<{
    channel: string,
    filters: FiltersState;
}> = ({ channel, filters }) => {
    const sigma = useSigma();
    const graph = sigma.getGraph();

    var emptyNodeDict= {};
    const [neighbors, setNeighbors] = useState(emptyNodeDict);

    useEffect(() => {
        populateData();
    }, [channel,filters]);

    function populateData(){
        var numNeigbors = 0;
        var nodeDict = {};
        graph.forEachNeighbor(channel, (neighbor) => {
            var clusterFilters = Object.keys(filters.clusters);
            clusterFilters.forEach(cluster => {
                if(graph.getNodeAttribute(neighbor, "cluster") == cluster){
                    numNeigbors += 1;
                    graph.forEachEdge(channel, (edge, attributes, source, target) => {
                        if (neighbor == source || neighbor == target) {
                            nodeDict[neighbor] = attributes.weight;
                        }
                    });
                }
            });
        });

        var items = Object.keys(nodeDict).map((key) =>{
            return [key, nodeDict[key]];
        });

        items.sort((first, second) => {
            return second[1] - first[1];
        });

        var keys = items.map((e) => {
            return e[0];
        });

        setNeighbors(Object.fromEntries(keys.map(x => [x, nodeDict[x]])));
    }

    return (
        <Panel
            initiallyDeployed={true}
            title={
                <>
                    <BsTv className="text-muted" />{" "}Channel Information
                </>
            }
        >
            <div id="nodeInfo">
                <h1 id="channelName"><a href={'https://twitch.tv/' + channel}>{channel}</a></h1>
                <p>Modularity Class: {graph.getNodeAttribute(channel, "cluster")}</p>
                <p>Neighbors: {graph.getNodeAttribute(channel, "degree")}</p>
                <p>Chatters: {graph.getNodeAttribute(channel, "totalChatters")}</p>
            </div>
            <table>
                <tr>
                    <th>Channel</th>
                    <th>Chatter Overlap</th>
                </tr>
                {Object.keys(neighbors).map((neighborName) => {
                    return (
                        <tr>
                        <td>
                            {graph.getNodeAttribute(neighborName, "originalLabel")}
                        </td>
                        <td>
                            {neighbors[neighborName]}
                        </td>
                        </tr>
                    )
                })}
            </table>
        </Panel>
    );
};

export default ChannelPanel;
