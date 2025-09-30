import z from "zod";

const ControlOptionsHome = z.object({
    zoomOnStart: z.boolean(),
});
const ControlOptionsMapMenu = z.object({
    isActive: z.boolean(),
});

export const ConfigurationSchema = z.object({
    controls: z.array(z.discriminatedUnion("name", [
        z.object({ name: z.literal("home"), options: ControlOptionsHome.optional() }),
        z.object({ name: z.literal("mapmenu"), options: ControlOptionsMapMenu.optional() }),
        z.object({ name: z.literal("sharemap") }),
        z.object({ name: z.literal("geoposition") }),
        z.object({ name: z.literal("print") }),
        z.object({ name: z.literal("about"), options: z.looseObject({}) }),
        z.object({ name: z.literal("link"), options: z.looseObject({}) }),
        z.object({ name: z.literal("legend"), options: z.looseObject({}) }),
        z.object({ name: z.literal("position"), options: z.looseObject({}) }),
        z.object({ name: z.literal("measure") }),
    ])),
    pageSettings: z.looseObject({}),
    projectionCode: z.string(),
    projectionExtent: z.array(z.number()).length(4),
    proj4Defs: z.array(z.looseObject({})),
    extent: z.array(z.number()).length(4),
    center: z.array(z.number()).length(2),
    zoom: z.number(),
    resolutions: z.array(z.number()),
    featureinfoOptions: z.looseObject({}),
    source: z.record(z.string(), z.looseObject({
        url: z.url(),
    })),
    groups: z.array(z.looseObject({
        name: z.string(),
        title: z.string(),
        expanded: z.boolean(),
    })),
    layers: z.array(z.looseObject({})),
    styles: z.record(z.string(), z.array(z.array(z.looseObject({})))),
});
export type Configuration = z.infer<typeof ConfigurationSchema>;
