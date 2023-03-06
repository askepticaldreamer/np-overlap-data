import React, { FC } from "react";
import { BsInfoCircle } from "react-icons/bs";

import Panel from "./Panel";

const DescriptionPanel: FC = () => {
    return (
        <Panel
            initiallyDeployed={true}
            title={
                <>
                    <BsInfoCircle className="text-muted" /> Description
                </>
            }
        >
            <h2>General</h2>
            <p>
                This project was inspired by <a href="https://github.com/KiranGershenfeld/VisualizingTwitchCommunities">VisualizingTwitchCommunities</a> and <a href="https://github.com/snoww/TwitchOverlap">TwitchOverlap</a>. This is a graph of the twitch streamers of the NoPixel community. Each node is a twitch channel and each edge represents shared chatters between the two channels.
            </p>
            <h2>Background</h2>
            <p>
                The list of channels to monitor was compiled by looking at <a href="https://nopixel.hasroot.com/serverInfo.php">HasRoot</a>. The project only monitored streamers who have been active in the past 3 months. For each of those channels, if they are live, we query their list of chatters every 30m. At the end of the day all this data is aggregated into a daily file and at the end of the month these daily files are aggregated into a monthly file. At the end of the month we look at HasRoot activity data for the past month and filter the data to include just those channels. That data was then imported into gephi where I ran the forceatlas layout algorithm.
            </p>
            <h2>Graph Interpretation</h2>
            <p>
                My understanding of how the force atlas algorithm works is the individual nodes repulse one another and the edges attract based on their weight. This means that channels with large overlap should be placed closer together. A node's position is determined by the push and pull of other nodes as well as its edges.
            </p>
            <p>
                Nodes are colored based on the community they were placed in. I believe a channel can have high overlap with another channel but may not be in the same community because they may not share high overlap with the rest of that community. Some nodes may also appear far away from the rest of their community. This is because the overlap they have with members outside of their community is pulling them away. Some nodes on the outskirts do not have any edges at all. This is because I had to filter out low weighted edges.
            </p>
            <h2>Navigation</h2>
            <p>
                <ul>
                    <li>Hover a node to view its edges and all neighbor nodes</li>
                    <li>Click a node to focus on it</li>
                    <li>Right click to reset focus</li>
                </ul>
            </p>
        </Panel>
    );
};

export default DescriptionPanel;
