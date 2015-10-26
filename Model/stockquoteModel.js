class stockquote {
    constructor(symbol, openArray, closeArray, highArray, lowArray, volumnArray, turnoverArray, dateArray) {
        this.symbol = symbol;
        this.opens = openArray;
        this.closes = closeArray;
        this.highs = highArray;
        this.lows = lowArray;
        this.volumns = volumnArray;
        this.turnovers = turnoverArray;
        this.dates = dateArray;
    }

}
export default stockquote;