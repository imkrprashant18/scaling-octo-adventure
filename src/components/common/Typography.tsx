import React from "react";
import clsx from "clsx";

interface TypographyProps {
        variant?:
        | "h1"
        | "h2"
        | "h3"
        | "h4"
        | "h5"
        | "h6"
        | "body"
        | "small"
        | "caption"
        | "span";
        color?:
        | "primary"
        | "secondary"
        | "muted"
        | "danger"
        | "success"
        | "warning"
        | "info"
        | "white"
        | "black";
        size?:
        | "xs"
        | "sm"
        | "base"
        | "lg"
        | "xl"
        | "2xl"
        | "3xl"
        | "4xl"
        | "5xl"
        | string;
        weight?: "light" | "normal" | "medium" | "semibold" | "bold" | "extrabold";
        align?: "left" | "center" | "right" | "justify";
        decoration?: "none" | "underline" | "line-through" | "overline";
        transform?: "normal-case" | "uppercase" | "lowercase" | "capitalize";
        tracking?: "tighter" | "tight" | "normal" | "wide" | "wider" | "widest";
        leading?: "none" | "tight" | "snug" | "normal" | "relaxed" | "loose";
        className?: string;
        children: React.ReactNode;
}

const getSizeClass = (size?: string) => {
        const sizeMap: Record<string, string> = {
                xs: "text-xs",
                sm: "text-sm",
                base: "text-base",
                lg: "text-lg",
                xl: "text-xl",
                "2xl": "text-2xl",
                "3xl": "text-3xl",
                "4xl": "text-4xl",
                "5xl": "text-5xl",
        };
        return size && sizeMap[size] ? sizeMap[size] : "";
};

const getWeightClass = (weight?: string) => {
        const weightMap: Record<string, string> = {
                light: "font-light",
                normal: "font-normal",
                medium: "font-medium",
                semibold: "font-semibold",
                bold: "font-bold",
                extrabold: "font-extrabold",
        };
        return weight && weightMap[weight] ? weightMap[weight] : "";
};

const getAlignClass = (align?: string) => {
        const alignMap: Record<string, string> = {
                left: "text-left",
                center: "text-center",
                right: "text-right",
                justify: "text-justify",
        };
        return align && alignMap[align] ? alignMap[align] : "";
};

const getTrackingClass = (tracking?: string) => {
        const trackingMap: Record<string, string> = {
                tighter: "tracking-tighter",
                tight: "tracking-tight",
                normal: "tracking-normal",
                wide: "tracking-wide",
                wider: "tracking-wider",
                widest: "tracking-widest",
        };
        return tracking && trackingMap[tracking] ? trackingMap[tracking] : "";
};

const getLeadingClass = (leading?: string) => {
        const leadingMap: Record<string, string> = {
                none: "leading-none",
                tight: "leading-tight",
                snug: "leading-snug",
                normal: "leading-normal",
                relaxed: "leading-relaxed",
                loose: "leading-loose",
        };
        return leading && leadingMap[leading] ? leadingMap[leading] : "";
};

const Typography: React.FC<TypographyProps> = ({
        variant = "body",
        color = "primary",
        size,
        weight,
        align,
        decoration = "none",
        transform,
        tracking,
        leading,
        className,
        children,
}) => {
        const variantClasses: Record<string, string> = {
                h1: "text-5xl font-bold",
                h2: "text-4xl font-semibold",
                h3: "text-3xl font-semibold",
                h4: "text-2xl font-medium",
                h5: "text-xl font-medium",
                h6: "text-lg font-medium",
                body: "text-base font-normal",
                small: "text-sm",
                caption: "text-xs",
        };

        const colorClasses: Record<string, string> = {
                primary: "text-primary dark:text-primary",
                secondary: "text-secondary dark:text-secondary",
                muted: "text-accent-foreground dark:text-accent-foreground",
                danger: "text-destructive dark:text-destructive",
                success: "text-success dark:text-success",
                warning: "text-warning dark:text-warning",
                info: "text-info dark:text-info",
                white: "text-white",
                black: "text-black",
        };

        const decorationMap: Record<string, string> = {
                underline: "underline",
                "line-through": "line-through",
                overline: "overline",
        };

        const transformMap: Record<string, string> = {
                "normal-case": "normal-case",
                uppercase: "uppercase",
                lowercase: "lowercase",
                capitalize: "capitalize",
        };

        const Tag =
                variant === "body" || variant === "small" || variant === "caption"
                        ? "p"
                        : variant;

        return (
                <Tag
                        className={clsx(
                                "font-poppins",
                                variantClasses[variant],
                                colorClasses[color],
                                getSizeClass(size),
                                getWeightClass(weight),
                                getAlignClass(align),
                                decoration !== "none" && decorationMap[decoration],
                                transform && transformMap[transform],
                                getTrackingClass(tracking),
                                getLeadingClass(leading),
                                className,
                        )}
                >
                        {children}
                </Tag>
        );
};

export default Typography;