import React, { FC, useEffect, useRef, useState } from 'react';
import { omit, mapValues, keyBy, constant } from "lodash";
import Sigma from "sigma";
import Graph from "graphology";
import { parse } from "graphology-gexf/browser";
import { UndirectedGraph } from 'graphology';
import RawGraph from './2-2023.gexf'
import { SigmaContainer } from "@react-sigma/core";
import "@react-sigma/core/lib/react-sigma.min.css";
import { useRegisterEvents, useSigma } from '@react-sigma/core';
import DescriptionPanel from './DescriptionPanel';
import SearchPanel from './SearchPanel'
import { drawHover } from './utilities/drawHover';
import { Cluster, FiltersState } from '../types';
import ClustersPanel from './ClustersPanel';
import ChannelPanel from './ChannelPanel';

const GraphData: FC = () => {
    var emptyClusters: Cluster[] = [];
    const [clusters, setClusters] = useState(emptyClusters);
    const [ dataReady, setDataReady ] = useState(false);
    const clustersComputed = useRef(false);
    const [ firstRender, setFirstRender] = useState(false);
    const graphLoaded = useRef(false);
    const sigmagraph = new UndirectedGraph();
    const graphRef = useRef(sigmagraph);
    const [ nodeIsSelected, setNodeIsSelected ] = useState(false);
    const [ focusedNode, setFocusedNode ] = useState("");
    const [ filtersState, setFiltersState ] = useState<FiltersState>({
        clusters: {}
    });

    useEffect(() => {
        document.title = "NoPixel Overlap Data";
    },[]);

    useEffect(() => {
        graphRef.current = LoadGexfToSigma(RawGraph, graphRef.current);
    },[]);

    function LoadGexfToSigma(RawGraph, sigmaGraph) {
        if (firstRender && graphLoaded.current){
            return sigmaGraph;
        }

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
                            totalChatters: attrs.original_size,
                            color: attrs.color,
                            cluster: attrs.modularity_class,
                            degree: attrs.degree
                        });
                });

                graphObj.forEachUndirectedEdge(function (key, attrs, source, target, sourceAttrs, targetAttributes) {
                    const colorVals = sourceAttrs.color.slice(4, -1);

                    sigmaGraph.addEdgeWithKey(key, source, target,
                        {
                            weight: attrs.weight,
                            size: 0.001,
                            color: `rgba(${colorVals},0.1)`,
                            width: 0.001,
                            hidden: true
                        });
                });
                setFirstRender(true);
                graphLoaded.current = true;
            });
        return sigmaGraph;
    }

    const GraphEvents: React.FC = () => {
        const registerEvents = useRegisterEvents();
        const sigma = useSigma();
        const graph = sigma.getGraph();

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
                    graph.forEachEdge((edge, attributes, source, target, sourceAttrs, targetAttributes) => {
                        if (e.node == source || e.node == target) {
                            graph.setEdgeAttribute(edge, "hidden", false)
                            if (e.node == source){
                                var colorVals = targetAttributes.color.slice(4, -1);
                                graph.setEdgeAttribute(edge, "color", `rgba(${colorVals},0.1)`);
                            }
                            else{
                                var colorVals = sourceAttrs.color.slice(4, -1);
                                graph.setEdgeAttribute(edge, "color", `rgba(${colorVals},0.1)`);
                            }
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
                    setFocusedNode(e.node);
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
                    graph.forEachEdge((edge, attributes, source, target,  sourceAttrs, targetAttributes) => {
                        if(e.node == source || e.node == target){
                            graph.setEdgeAttribute(edge, "hidden", false)
                            if (e.node == source) {
                                var colorVals = targetAttributes.color.slice(4, -1);
                                graph.setEdgeAttribute(edge, "color", `rgba(${colorVals},0.1)`);
                            }
                            else {
                                var colorVals = sourceAttrs.color.slice(4, -1);
                                graph.setEdgeAttribute(edge, "color", `rgba(${colorVals},0.1)`);
                            }
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

        useEffect(() => {
            if (clustersComputed.current) {
                return;
            }
            var clusterDictionary = {}
            graph.forEachNode((node) => {
                var clusterClass = graph.getNodeAttribute(node, "cluster");
                var color = graph.getNodeAttribute(node, "color");

                clusterDictionary[clusterClass] = {
                    "key": clusterClass,
                    "color": color,
                    "clusterLabel": clusterClass
                };
            });

            const clusters: Cluster[] = [];
            for (let cluster in clusterDictionary) {
                clusters.push(clusterDictionary[cluster]);
            }

            if (clusters.length != 0) {
                clustersComputed.current = true;
                setFiltersState({
                    clusters: mapValues(keyBy(clusters, "key"), constant(true))
                });
                setClusters(clusters);
                setDataReady(true);
            }
        }, [firstRender]);

        // Apply filters
        useEffect(() => {
            var filteredClusters = filtersState.clusters;
            graph.forEachNode((node, { cluster }) =>
                graph.setNodeAttribute(node, "hidden", !filteredClusters[cluster]),
            );
        }, [ filtersState ]);
        return null;
    };

    if(!graphLoaded.current){
        return null;
    }

    return (
        <SigmaContainer id='SigmaCanvas'
            style={{ height: "100vh", width: '100vw' }}
            graph={graphRef.current}
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
            <><GraphEvents /><div className="panels">
                <SearchPanel filters={filtersState} />
                {nodeIsSelected && (
                    <ChannelPanel
                        channel={focusedNode}
                        filters={filtersState}
                    />
                )}
                    <DescriptionPanel />
                    {dataReady && (
                        <ClustersPanel
                            clusters={clusters}
                            filters={filtersState}
                            setClusters={(clusters) => setFiltersState((filters) => ({
                                ...filters,
                                clusters,
                            }))}
                            toggleCluster={(cluster) => {
                                setFiltersState((filters) => ({
                                    ...filters,
                                    clusters: filters.clusters[cluster]
                                        ? omit(filters.clusters, cluster)
                                        : { ...filters.clusters, [cluster]: true },
                                }));
                            } } />
                    )}
                </div></>
        </SigmaContainer>
    )
};

export default GraphData;