import React from "react";
import clsx from "clsx";

interface DefaultContainerProps extends React.HTMLAttributes<HTMLDivElement> {
        display?:
        | "flex"
        | "grid"
        | "block"
        | "inline-flex"
        | "inline-block"
        | null
        | string;
        direction?: "row" | "row-reverse" | "col" | "col-reverse" | null | string;
        align?: "start" | "center" | "end" | "stretch" | "baseline" | null | string;
        justify?:
        | "start"
        | "center"
        | "end"
        | "between"
        | "around"
        | "evenly"
        | null
        | string;
        wrap?: "wrap" | "nowrap" | "wrap-reverse" | null | string;
        gap?: string | null;
        gridCols?: string;
        padding?: string;
        margin?: string;
        width?: "full" | string;
        height?: "full" | string;
        rounded?: string;
        shadow?: string;
        bg?: string;
        border?: boolean;
        borderColor?: string;
        className?: string;
        children: React.ReactNode;
}

const getFlexDirection = (dir?: string | null) => {
        const directionMap: Record<string, string> = {
                row: "flex-row",
                "row-reverse": "flex-row-reverse",
                col: "flex-col",
                "col-reverse": "flex-col-reverse",
        };
        return dir && directionMap[dir] ? directionMap[dir] : "";
};

const getAlignItems = (align?: string | null) => {
        const alignMap: Record<string, string> = {
                start: "items-start",
                center: "items-center",
                end: "items-end",
                stretch: "items-stretch",
                baseline: "items-baseline",
        };
        return align && alignMap[align] ? alignMap[align] : "";
};

const getJustifyContent = (justify?: string | null) => {
        const justifyMap: Record<string, string> = {
                start: "justify-start",
                center: "justify-center",
                end: "justify-end",
                between: "justify-between",
                around: "justify-around",
                evenly: "justify-evenly",
        };
        return justify && justifyMap[justify] ? justifyMap[justify] : "";
};

const getFlexWrap = (wrap?: string | null) => {
        const wrapMap: Record<string, string> = {
                wrap: "flex-wrap",
                nowrap: "flex-nowrap",
                "wrap-reverse": "flex-wrap-reverse",
        };
        return wrap && wrapMap[wrap] ? wrapMap[wrap] : "";
};

const getGap = (gap?: string | null) => {
        const gapMap: Record<string, string> = {
                "1": "gap-1",
                "2": "gap-2",
                "3": "gap-3",
                "4": "gap-4",
                "6": "gap-6",
                "8": "gap-8",
        };
        return gap && gapMap[gap] ? gapMap[gap] : gap ? `gap-${gap}` : "";
};

const DefaultContainer: React.FC<DefaultContainerProps> = ({
        display = "flex",
        direction,
        align,
        justify,
        wrap,
        gap,
        gridCols,
        padding,
        margin,
        width,
        height,
        rounded,
        shadow,
        bg,
        border,
        borderColor,
        className,
        children,
        ...props
}) => {
        const displayClass =
                display === "flex"
                        ? "flex"
                        : display === "grid"
                                ? "grid"
                                : display === "block"
                                        ? "block"
                                        : display === "inline-flex"
                                                ? "inline-flex"
                                                : display === "inline-block"
                                                        ? "inline-block"
                                                        : "";

        const containerClasses = clsx(
                displayClass,
                getFlexDirection(direction),
                getFlexWrap(wrap),
                getAlignItems(align),
                getJustifyContent(justify),
                getGap(gap),
                padding && `p-${padding}`,
                margin && `m-${margin}`,
                width && width === "full" ? "w-full" : width ? `w-${width}` : "",
                height && height === "full" ? "h-full" : height ? `h-${height}` : "",
                rounded && `rounded-${rounded}`,
                shadow && `shadow-${shadow}`,
                bg && `${bg}`,
                border && "border",
                borderColor && `border-${borderColor}`,
                className,
        );

        return (
                <div className={containerClasses} {...props}>
                        {children}
                </div>
        );
};

export default DefaultContainer;
