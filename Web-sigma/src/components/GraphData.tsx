import React, { FC, useEffect, useState } from 'react';
import Sigma from "sigma";
import Graph from "graphology";
import { parse } from "graphology-gexf/browser";
import { UndirectedGraph } from 'graphology';
//import RawGraph from './webdata.gexf'
import RawGraph from './2-2023.gexf'
import { SigmaContainer } from "@react-sigma/core";
import "@react-sigma/core/lib/react-sigma.min.css";
import { useRegisterEvents, useSigma } from '@react-sigma/core';
import { Settings } from "sigma/settings";
import { NodeDisplayData, PartialButFor, PlainObject } from "sigma/types";
import DescriptionPanel from './DescriptionPanel';
import SearchPanel from './SearchPanel'
import { drawHover } from './utilities/drawHover';
import { FiltersState } from '../types';

const GraphData: FC = () => {
    const [graph, setGraph] = useState(LoadGexfToSigma(RawGraph));
    const [ nodeIsSelected, setNodeIsSelected ] = useState(false);
    const [ filtersState, setFiltersState ] = useState<FiltersState>({
        clusters: {},
        tags: {}
    });

    const GraphEvents: React.FC = () => {
        const registerEvents = useRegisterEvents();
        const sigma = useSigma();
        useEffect(() => {
            registerEvents({
                enterNode: (e) => {
                    if(nodeIsSelected){
                        return;
                    }
                    //highlight neighbors
                    e.preventSigmaDefault();
                    graph.forEachNode((node) => {
                        if (graph.areNeighbors(e.node, node) || e.node == node) {
                            graph.setNodeAttribute(node, "forceLabel", true);
                        }
                        else {
                            graph.setNodeAttribute(node, "forceLabel", false);
                        }
                    });
                    //only show this node's edges
                    graph.forEachEdge((edge, attributes, source, target) => {
                        if (e.node == source || e.node == target) {
                            graph.setEdgeAttribute(edge, "hidden", false)
                        }
                        else {
                            graph.setEdgeAttribute(edge, "hidden", true)
                        }
                    });
                    sigma.refresh();
                },
                leaveNode: (e) => {
                    if (nodeIsSelected) {
                        return;
                    }
                    //reset nodes/edges
                    graph.forEachNode((node) => {
                        graph.setNodeAttribute(node, "forceLabel", false);
                    });

                    graph.forEachEdge((edge, attributes, source, target) => {
                        graph.setEdgeAttribute(edge, "hidden", true)
                    });
                    sigma.refresh();
                },
                clickNode: (e) => {
                    setNodeIsSelected(true);
                    //  show label for neighbors
                    graph.forEachNode((node) => {
                        if (graph.areNeighbors(e.node, node) || e.node == node) {
                            graph.setNodeAttribute(node, "forceLabel", true);
                            graph.setNodeAttribute(node, "label", graph.getNodeAttribute(node, "originalLabel"));
                        }
                        else {
                            graph.setNodeAttribute(node, "forceLabel", false);
                            graph.setNodeAttribute(node, "label", "");
                        }
                    });
                    // hide other edges
                    graph.forEachEdge((edge, attributes, source, target) => {
                        if(e.node == source || e.node == target){
                            graph.setEdgeAttribute(edge, "hidden", false)
                        }
                        else{
                            graph.setEdgeAttribute(edge, "hidden", true)
                        }
                    });
                    sigma.refresh();
                },
                rightClick: (event) => {
                    event.original.preventDefault();
                    setNodeIsSelected(false);
                    graph.forEachEdge((edge) =>{
                        graph.setEdgeAttribute(edge, "hidden", true);
                    });
                    graph.forEachNode((node) => {
                        graph.setNodeAttribute(node, "hidden", false);
                        graph.setNodeAttribute(node, "highlighted", false);
                        graph.setNodeAttribute(node, "forceLabel", false);
                        graph.setNodeAttribute(node, "label", graph.getNodeAttribute(node, "originalLabel"));
                    });
                    sigma.refresh();
                }
            });
        }, [registerEvents]);
        return null;
    };
    return (
        <SigmaContainer id='SigmaCanvas'
            style={{ height: "100vh", width: '100vw' }}
            graph={graph}
            settings={{
                renderLabels: true,
                labelColor: {
                    color: "white"
                },
                labelSize: 12,
                maxCameraRatio: 20,
                minCameraRatio: .1,
                labelDensity: 1,
                labelRenderedSizeThreshold: 3,
                labelGridCellSize: 10,
                hoverRenderer: drawHover
            }}>
            <GraphEvents/>
            <div className="panels">
                <SearchPanel filters={filtersState} />
                <DescriptionPanel />
            </div>
        </SigmaContainer>
    )
};

function LoadGexfToSigma(RawGraph) {
    const sigmaGraph = new UndirectedGraph();

    // Load external GEXF file:
    fetch(RawGraph)
        .then((res) => res.text())
        .then((gexf) => {
            // Parse GEXF string:
            const graphObj = parse(Graph, gexf);
            graphObj.forEachNode(function (key, attrs) {
                sigmaGraph.addNode(key,
                    {
                        x: attrs.x,
                        y: attrs.y,
                        label: attrs.label,
                        originalLabel: attrs.label,
                        size: attrs.size / 4,
                        color: attrs.color
                    });
            });

            graphObj.forEachUndirectedEdge(function (key, attrs, source, target, sourceAttrs, targetAttributes) {
                const colorVals = sourceAttrs.color.slice(4, -1);
                const colorVals2 = targetAttributes.color.slice(4, -1);

                // Make edge color the color of the larger node
                const size1 = sigmaGraph.getNodeAttribute(source, "size");
                const size2 = sigmaGraph.getNodeAttribute(target, "size");
                const newCol = (size1 > size2) ? `rgba(${colorVals},0.1)` : `rgba(${colorVals2},0.1)`;

                sigmaGraph.addEdgeWithKey(key, source, target,
                    {
                        weight: attrs.weight / 10,
                        size: 0.001,
                        color: newCol,
                        width: 0.001,
                        hidden: true
                    });
            });
        })
    return sigmaGraph;
}

export default GraphData;