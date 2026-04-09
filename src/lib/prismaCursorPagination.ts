

type CursorPaginationParams = {
        model: any;
        where?: any;
        select?: any;
        orderBy?: any;
        limit?: number;
        cursor?: string;
        cursorField?: string;
};

export const prismaCursorPagination = async ({
        model,
        where = {},
        select,
        orderBy = { createdAt: "desc" },
        limit = 10,
        cursor,
        cursorField = "id",
}: CursorPaginationParams) => {
        const take = limit;

        const data = await model.findMany({
                where,
                select,
                take,

                ...(cursor
                        ? {
                                skip: 1,
                                cursor: {
                                        [cursorField]: cursor,
                                },
                        }
                        : {}),

                orderBy,
        });

        const nextCursor =
                data.length === limit ? data[data.length - 1][cursorField] : null;

        const total = await model.count({ where });

        return {
                data,
                meta: {
                        total,
                        limit,
                        nextCursor,
                        hasNextPage: !!nextCursor,
                },
        };
};