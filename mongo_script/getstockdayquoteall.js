db.stockDayQuote.aggregate(
    // Pipeline
    [
        // Stage 1
        {
            $sort: {
                "symbol": 1,
                "date": 1
            }
        },

        // Stage 2
        {
            $group: {
                "_id": "$symbol",
                "highs": {
                    "$push": "$high"
                },
                "lows": {
                    "$push": "$low"
                },
                "opens": {
                    "$push": "$open"
                },
                "closes": {
                    "$push": "$close"
                },
                "volumes": {
                    "$push": {$ifNull: ["$volume", 0]}
                },
                "turnovers": {
                    "$push": {$ifNull: ["$turnover", 0]}
                }
            }
        },

        // Stage 3
        {
            $out: "stockQuotesArray"
        }
    ],

    // Options
    {
        allowDiskUse: true
    }

    // Created with 3T MongoChef, the GUI for MongoDB - http://3t.io/mongochef

);
