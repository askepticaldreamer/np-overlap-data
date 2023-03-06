import { Settings } from "sigma/settings";
import { PartialButFor, NodeDisplayData } from "sigma/types";

export function drawRoundRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number,
): void {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
}

/**
 * Draw an hovered node.
 * - if there is no label => display a shadow on the node
 * - if the label box is bigger than node size => display a label box that contains the node with a shadow
 * - else node with shadow and the label box
 */
export function drawHover(
    context: CanvasRenderingContext2D,
    data: PartialButFor<NodeDisplayData, "x" | "y" | "size" | "label" | "color">,
    settings: Settings,
): void {
    const size = settings.labelSize,
        font = settings.labelFont,
        weight = settings.labelWeight;

    context.font = `${weight} ${size}px ${font}`;

    // Then we draw the label background
    context.fillStyle = "grey";
    context.shadowOffsetX = 0;
    context.shadowOffsetY = 0;
    context.shadowBlur = 8;
    context.shadowColor = "#000";

    const PADDING = 2;

    if (typeof data.label === "string") {
        const textWidth = context.measureText(data.label).width,
            boxWidth = Math.round(textWidth + 5),
            boxHeight = Math.round(size + 2 * PADDING),
            radius = Math.max(data.size, size / 2) + PADDING;

        const angleRadian = Math.asin(boxHeight / 2 / radius);
        const xDeltaCoord = Math.sqrt(Math.abs(Math.pow(radius, 2) - Math.pow(boxHeight / 2, 2)));

        context.beginPath();
        context.moveTo(data.x + xDeltaCoord, data.y + boxHeight / 2);
        context.lineTo(data.x + radius + boxWidth, data.y + boxHeight / 2);
        context.lineTo(data.x + radius + boxWidth, data.y - boxHeight / 2);
        context.lineTo(data.x + xDeltaCoord, data.y - boxHeight / 2);
        context.arc(data.x, data.y, radius, angleRadian, -angleRadian);
        context.closePath();
        context.fill();
    } else {
        context.beginPath();
        context.arc(data.x, data.y, data.size + PADDING, 0, Math.PI * 2);
        context.closePath();
        context.fill();
    }

    context.shadowOffsetX = 0;
    context.shadowOffsetY = 0;
    context.shadowBlur = 0;

    // And finally we draw the label
    drawLabel(context, data, settings);
}

/**
 * Custom label renderer
 */
export function drawLabel(
    context: CanvasRenderingContext2D,
    data: PartialButFor<NodeDisplayData, "x" | "y" | "size" | "label" | "color">,
    settings: Settings,
): void {
    if (!data.label) return;

    const size = settings.labelSize,
        font = settings.labelFont,
        weight = settings.labelWeight;

    context.font = `${weight} ${size}px ${font}`;
    const width = context.measureText(data.label).width + 8;

    context.fillStyle = "#ffffffcc";
    context.fillRect(data.x + data.size, data.y + size / 3 - 15, width, 20);

    context.fillStyle = "#000";
    context.fillText(data.label, data.x + data.size + 3, data.y + size / 3);
}