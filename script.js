let articles;
let articleChains;
let articleNouns;
let providerCounts = [];
let providerSentiments = [];
let primaryProviders = [];
let selectedProviders = [];

document.addEventListener("DOMContentLoaded", function(){
    // D3 Visualization Code Goes Here
    Promise.all([d3.csv("data/news_articles.csv"), d3.json("data/cluster_nouns.json"), d3.csv("data/provider_sentiment.csv")]).then(function(data) {
        articles = data[0];
        console.log("Articles: ", articles);
        articleChains = data[1].map(d => d.cluster)
        articleNouns = data[1].map(d => ({
            properNouns: d.proper_nouns,
            commonNouns: d.common_nouns
        }));
        providerSentiments = data[2];
        providerSentiments.forEach(function (d) {
            d.total = d.positive + d.negative + d.neutral; 
        });
        console.log("Provider Sentiments: ", providerSentiments);
        const initArticles = articleChains.map(d => d[0]);
        const primaryArticles = articles.filter((d, i) => initArticles.includes(i));
        console.log("Primary Articles: ", primaryArticles)
        primaryProviders = d3.rollup(primaryArticles, v => v.length, d => d.provider);
        primaryProviders = Array.from(primaryProviders).sort((a, b) => b[1] - a[1]).filter((d, i) => i > 10).map(d => d[0]);

        console.log("Primary Providers: ", primaryProviders);
        console.log("Article Chains: ", articleChains);
        console.log("Article Nouns: ", articleNouns);
        providerCounts = d3.rollups(articles, v => v.length, d => d.provider);
        let prevProviderCount = 0;
        providerCounts.forEach(d => {
            d.middle = prevProviderCount + Math.floor(d[1] / 2);
            d.primary = primaryProviders.includes(d[0]);
            prevProviderCount += d[1];
        })
        console.log("Provider Counts: ", providerCounts);
        selectedProviders = providerCounts.map(d => d[0])
        drawCircularChartControls();
        drawCircularNetworkChart();
        drawWordCloud(0);
        drawTimeLineChart(0);
        drawSegmentedChart();
    });
});

const generateLinkData = () => {
    const nodes = []
    const links = [];
    // const ignoreArticles = new Set();
    const middles = providerCounts.map(d => d.middle);

    articles.forEach((article, articleIndex) => {
        nodes.push({
            "id": articleIndex,
            "name": article.title,
            "provider": article.provider,
            "type": "article",
            "middle": middles.includes(articleIndex),
            "chain": articleChains.findIndex(chain => chain.includes(articleIndex)),
            "primary": primaryProviders.includes(article.provider)
        });
    });
    articleChains.forEach((chain, index) => {
        let prevIndex = null;
        chain.forEach(ind => {
            if(prevIndex != null) {
                links.push({
                    "source": prevIndex,
                    "target": ind,
                    "chain": index
                });
            }
            prevIndex = ind;
        });
    });
    return { nodes, links };
}

let networkSvg = null;
let networkX = null;
let articleSampleSize = 10;

const drawCircularChartControls = () => {
    // networkControls.sampleSelector();
    function dashToName(str) {
        return str
            .split('-')
            .map((word, index) => {
                return word.charAt(0).toUpperCase() + word.slice(1);
            })
            .join(' ');
    }

    d3.select("#select-providers").data(providerCounts).selectAll("option")
        .data(providerCounts)
        .join(
            enter => {
                const div = enter.append("div")
                                .attr("class", "form-check form-check-inline bg-blue-100 px-2 rounded-lg");
                div.append("input")
                    .attr("class", "form-check-input mr-2")
                    .attr("type", "checkbox")
                    .attr("id", d => d[0])
                    .attr("value", d => selectedProviders)
                    .attr("checked", true)
                    .on("change", function(value) {
                        if(this.checked) {
                            selectedProviders.push(this.id);
                        } else {
                            selectedProviders = selectedProviders.filter(d => d != this.id);
                        }
                        drawCircularNetworkChart();
                        drawSegmentedChart();
                    });
                div.append("label")
                    .attr("class", "form-check-label")
                    .attr("for", d => d[0])
                    .text(d => dashToName(d[0]));
            },
            update => update,
            exit => exit.remove()
        );
    
    const selectAllDiv = d3.select("#select-providers").append("div")
                            .attr("class", "form-check form-check-inline bg-green-100 px-2 rounded-lg");
    selectAllDiv.append("input")
        .attr("class", "form-check-input mr-2")
        .attr("type", "checkbox")
        .attr("id", "select-all")
        .attr("value", "all")
        .attr("checked", true)
        .on("change", function(value) {
            if(this.checked) {
                selectedProviders = providerCounts.map(d => d[0]);
            } else {
                selectedProviders = [];
            }
            d3.select("#select-providers").selectAll("input").property("checked", this.checked);
            drawCircularNetworkChart();
            drawSegmentedChart();
        });
    selectAllDiv.append("label")
        .attr("class", "form-check-label")
        .attr("for", "select-all")
        .text("Select All");
}

const drawCircularNetworkChart = () => {
    const margin = {top: 50, right: 50, bottom: 50, left: 50};
    const width = 1000 - margin.left - margin.right;
    const height = 1000 - margin.top - margin.bottom;

    const padding = 100;

    var diameter = width - padding;
    var radius = diameter / 2;
    var innerRadius = radius - 70;

    const color = {
        'primary': d3.interpolateBlues(1),
        'secondary': d3.interpolateBlues(0.4),
    }

    if(networkSvg != null) networkSvg.remove();
    networkSvg = d3.select("#network-link-chart")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform",
            `translate(${radius + padding/2 + margin.left},${radius + padding/2 + margin.top})`);
    networkX = networkSvg.append("g")
        .attr("transform", "translate(0," + height + ")");

    var cluster = d3.cluster()
        .size([360, innerRadius])
        .separation((a, b) => (a.parent == b.parent ? 1 : 4));

    const xAccessor = (d) => {
        var angle = (d.x - 90) / 180 * Math.PI, radius = d.y;
        return radius * Math.cos(angle);
    }
        
    const yAccessor = (d) => {
        var angle = (d.x - 90) / 180 * Math.PI, radius = d.y;
        return radius * Math.sin(angle);
    }

    var line = d3.line()
        .x(xAccessor)
        .y(yAccessor)
        .curve(d3.curveBundle.beta(0.8));

    var data = generateLinkData();
    data.nodes = data.nodes.filter(d => d.type === "article");
    idToNode = {};
    data.nodes.forEach(d => {
        idToNode[d.id] = d;
    });
    data.links.forEach(d => {
        d.source = idToNode[d.source];
        d.target = idToNode[d.target];
    });
    data.links = data.links.filter(d => (
        selectedProviders.includes(d.source.provider) ||
        selectedProviders.includes(d.target.provider)
    ));
    console.log("Circular Network Data: ", data);

    let hierarchy = {
        name: 'root',
        children: []
    };
    const nested = d3.group(data.nodes, d => d.provider);
        nested.forEach((value, key) => {
            nested.set(key, {
                name: key,
                children: value
            });
        }
    );
    nested.forEach((value, key) => {
        value.children.forEach(child => {
            child.children = [];
        });
        hierarchy.children.push(value);
    });
    // console.log("Hierarchy: ", hierarchy);

    var tree = cluster(d3.hierarchy(hierarchy));

    var leaves = tree.leaves();
    // console.log("Leaves: ", leaves);

    var paths = data.links.map(function (l) {
        var source = leaves.filter(d => d.data.id === l.source.id)[0];
        var target = leaves.filter(d => d.data.id === l.target.id)[0];
        return source.path(target);
    })
    // console.log("Paths: ", paths);

    var link = networkSvg.selectAll('.link')
        .data(paths)
        .enter().append('path')
        .attr('class', d => `link chain-${d[0].data.chain}`)
        .attr('d', function (d) { return line(d) })
        .style('stroke', d3.interpolateBlues(0.2))
        .style('stroke-width', 1)
        .style('fill', 'none')
        .style('opacity', 0.5)
        .on('mouseover', function (e) {
            const chain = e.target.classList.value.split(' ').find(d => d.includes("chain-"));
            d3.selectAll(`.${chain}`)
                .style('stroke', d3.interpolateBlues(0.8))
                .style('stroke-width', 2)
                .style('opacity', 0.8);
        }).on('mouseout', function (e) {
            const chain = e.target.classList.value.split(' ').find(d => d.includes("chain-"));
            d3.selectAll(`.${chain}`)
                .style('stroke', d3.interpolateBlues(0.2))
                .style('stroke-width', 1)
                .style('opacity', 0.5);
        }).on('click', function (e) {
            const chain = e.target.classList.value.split(' ').find(d => d.includes("chain-"));
            const chainIndex = parseInt(chain.split('-')[1]);
            drawWordCloud(chainIndex);
            drawTimeLineChart(chainIndex);
        });
    
    var node = networkSvg.selectAll('.node')
        .data(leaves)
        .enter().append('g')
        .attr('class', 'node')
        .attr('transform', function (d) { return 'translate(' + xAccessor(d) + ',' + yAccessor(d) + ')'; })

    
    node.append('circle').attr('r', 4)
        .style('fill', d => d.data.primary ? color.primary : color.secondary)
    
    node.append('text')
        .attr('dy', '0.32em')
        .attr('x', function (d) { return d.x < 180 ? 6 : -6; })
        .style('text-anchor', function (d) { return d.x < 180 ? 'start' : 'end'; })
        .attr('transform', function (d) { return 'rotate(' + (d.x < 180 ? d.x - 90 : d.x + 90) + ')'; })
        .text(function (d) { if(d.data.middle) return d.data.provider; });

    var legend = networkSvg.append("g")
        .attr("class", "legend")
        .attr("transform", "translate(" + (width/2-100) + "," + (-height/2+100) + ")")
        .selectAll("g")
        .data(["primary", "secondary"])
        .enter().append("g");
    
    legend.append("rect")
        .attr("y", function(d, i) { return i * 25; })
        .attr("width", 20)
        .attr("height", 20)
        .style("fill", function(d) { return color[d.toLowerCase()]; });
    
    legend.append("text")
        .attr("y", function(d, i) { return i * 25 + 10; })
        .attr("x", 25)
        .attr("dy", "0.32em")
        .text(d => d === "primary" ? "Primary" : "Derivative");

    
    // Add title to the chart
    networkSvg.append("text")
        .attr("x", 0)             
        .attr("y", 0 - (margin.top / 2) - height/2)
        .attr("text-anchor", "middle")  
        .style("font-size", "16px") 
        .style("text-decoration", "underline")  
        .text("Provider Network");

}

let wordCloudSvg = null;

const wordCloudControls = {
    chainSelector: null
}

const drawWordCloudControls = (chainIndex) => {
    const minIndex = 0;
    const maxIndex = articleChains.length - 1;
    if(wordCloudControls.chainSelector == null) {
        wordCloudControls.chainSelector = d3.select("#word-cloud-select")
        .attr("min", 0)
        .attr("max", articleChains.length - 1)
        .attr("step", 1)
        .on("input", function() {
            if(this.value < minIndex) this.value = minIndex;
            if(this.value > maxIndex) this.value = maxIndex;
            drawWordCloud(this.value);
        });
    }
    wordCloudControls.chainSelector.property("value", chainIndex);
}

const drawWordCloud = (chainIndex) => {
    drawWordCloudControls(chainIndex);
    const margin = {top: 10, right: 10, bottom: 10, left: 10};
    const width = 600 - margin.left - margin.right;
    const height = 600 - margin.top - margin.bottom;

    let nouns = articleNouns[chainIndex];
    const properNouns = nouns.properNouns;
    const commonNouns = nouns.commonNouns;

    nouns = properNouns.concat(commonNouns);

    const wordSizeScale = d3.scaleLinear()
        .domain(d3.extent(nouns, d => d[1]))
        .range([10, 50]);
    
    const wordColorScale = d3.scaleOrdinal(d3.schemeCategory10).domain(properNouns);

    if(wordCloudSvg != null) wordCloudSvg.remove();
    wordCloudSvg = d3.select("#word-cloud-chart")
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr('transform', `translate(${width/2}, ${height/2})`);

    const draw = (words) => {
        wordCloudSvg
            .selectAll("text")
            .data(words)
            .enter().append("text")
            .attr("class", "word")
            .style("font-size", d => `${d.size}px`)
            .style("fill", d => wordColorScale(d.text))
            .attr("text-anchor", "middle")
            .attr("transform", d => `translate(${[d.x, d.y]})rotate(${d.rotate})`)
            .text(d => d.text)
            .on("mouseover", function() {
                d3.select(this).style("font-weight", "bold");
            })
            .on("mouseout", function() {
                d3.select(this).style("font-weight", "normal");
            });
    }

    
    const layout = d3.layout.cloud()
        .size([width, height])
        .words(nouns.map((d) => (
            {text: d[0], size: wordSizeScale(d[1])}
        )))
        .padding(5)
        .rotate(function() { return ~~(Math.random() * 2) * 90; })
        .fontSize(function(d) { return d.size; })
        .on("end", draw);
    
    layout.start();
    
}

let segmentedSvg = null;

const drawSegmentedChart = () => {
    const data = providerSentiments.filter(d => selectedProviders.includes(d.provider));
    if(segmentedSvg != null) segmentedSvg.remove();
    const margin = {top: 40, right: 30, bottom: 90, left: 50};
    const width = 600 - margin.left - margin.right;
    const height = 600 - margin.top - margin.bottom;

    segmentedSvg = d3.select("#segmented-chart")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // Define color mapping
    const colorMap = {
        "negative": "#FF6666",
        "neutral": "#6699CC",
        "positive": "#66CC66"
    };

    // Parse and stack the data
    data.forEach(d => {
        d.negative = +d.negative;
        d.neutral = +d.neutral;
        d.positive = +d.positive;
    });

    const stack = d3.stack().keys(["negative", "neutral", "positive"]);
    const stackedData = stack(data);

    // Scales
    const xScale = d3.scaleBand()
        .range([0, width])
        .domain(data.map(d => d.provider))
        .padding(0.2);

    const yScale = d3.scaleLinear()
        .range([height, 0])
        .domain([0, d3.max(data, d => d.negative + d.neutral + d.positive)]);

    // Bars
    segmentedSvg.append("g")
        .selectAll("g")
        .data(stackedData)
        .enter().append("g")
            .attr("fill", d => colorMap[d.key])
        .selectAll("rect")
        .data(d => d)
        .enter().append("rect")
            .attr("x", d => xScale(d.data.provider))
            .attr("y", d => yScale(d[1]))
            .attr("height", d => yScale(d[0]) - yScale(d[1]))
            .attr("width", xScale.bandwidth());

    // Axes
    segmentedSvg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(xScale))
        .selectAll("text")  
        .style("text-anchor", "end")
        .attr("dx", "-.8em")
        .attr("dy", ".15em")
        .attr("transform", "rotate(-45)");

    segmentedSvg.append("g")
        .call(d3.axisLeft(yScale));

    // Legend
    const legend = segmentedSvg.append("g")
        .attr("font-family", "sans-serif")
        .attr("font-size", 10)
        .attr("text-anchor", "end")
        .selectAll("g")
        .data(Object.keys(colorMap).slice().reverse())
        .enter().append("g")
        .attr("transform", (d, i) => "translate(0," + i * 20 + ")");

    legend.append("rect")
        .attr("x", width - 19)
        .attr("width", 19)
        .attr("height", 19)
        .attr("fill", d => colorMap[d]);

    legend.append("text")
        .attr("x", width - 24)
        .attr("y", 9.5)
        .attr("dy", "0.32em")
        .text(d => d);
    
    // Add title to the chart
    segmentedSvg.append("text")
        .attr("x", (width / 2))             
        .attr("y", 0 - (margin.top / 2))
        .attr("text-anchor", "middle")  
        .style("font-size", "16px") 
        .style("text-decoration", "underline")  
        .text("Segmented Provider Sentiments");

}


const drawTimeLineChart = (chainIndex) => {
    const chain = articleChains[chainIndex];

    // Filtering the chainArticles based on selectedProviders
    const chainArticles = chain.map(index => articles[index])
                               .filter(article => selectedProviders.includes(article.provider));
                               
    // console.log(chainArticles);

    d3.select("#timeline-chart").selectAll("*").remove();

    const width = 1000;
    const height = 700;
    const margin = { top: 10, right: 20, bottom: 50, left: 150 };

    // Extract news sources from the chainArticles
    const newsSourcesInChain = Array.from(new Set(chainArticles.map(article => article.provider)));

    const timelineSvg = d3.select("#timeline-chart")
                          .attr("width", width)
                          .attr("height", height);
    const parseDate = d3.timeParse("%Y-%m-%d");

    const dates = chainArticles.map(d => parseDate(d.published));

    const xScale = d3.scaleTime()
                     .domain([d3.timeDay.offset(d3.extent(dates)[0], -1), // Subtract the time interval from the minimum date
                            d3.timeDay.offset(d3.extent(dates)[1], 1)   // Add the time interval to the maximum date
                            ])
                     .range([margin.left, width - margin.right]);


    const yScale = d3.scaleBand()
                     .domain(newsSourcesInChain) // Use selectedProviders for the domain
                     .range([height - margin.bottom, margin.top])
                     .padding(.5);


    const sentimentColorScale = d3.scaleOrdinal()
                                  .domain(['positive', 'negative', 'neutral'])
                                  .range(['#39CD39', '#FF7983', '#60C5F5']); // Adjust colors as needed

    
    timelineSvg.append("g")
               .attr("transform", `translate(0,${height - margin.bottom})`)
               .call(d3.axisBottom(xScale)
               .ticks(d3.timeDay.every(1)) 
               .tickFormat(d3.timeFormat("%a %d"))); 

    
    timelineSvg.append('g')
               .attr("class", "y-axis")
               .attr("transform", `translate(${margin.left},0)`)
               .call(d3.axisLeft(yScale))
               .call(g => g.selectAll(".tick text")
               .attr("font-weight", "bold"));


    const line = d3.line()
                   .x(d => xScale(parseDate(d.published)))
                   .y(d => yScale(d.provider) + yScale.bandwidth() / 2)
                   .curve(d3.curveMonotoneY); 

    timelineSvg.append("path")
               .datum(chainArticles)
               .attr("class", "line")
               .attr("d", line)
               .style("fill", "none")
               .style("stroke", "gray");


    timelineSvg.selectAll('circle')
               .data(chainArticles)
               .enter()
               .append('circle')
               .attr('cx', d => xScale(parseDate(d.published)))
               .attr('cy', d => yScale(d.provider) + yScale.bandwidth() / 2)
               .attr('r', 10)
               .style('fill', d => sentimentColorScale(d.total_sentiment))
               .append("title")
               .text(d => `${d.filepath}\n${d.provider}\n${d.published}`);


   
    timelineSvg.append("text")
               .attr("transform", `translate(${width / 2}, ${height})`)
               .style("text-anchor", "middle")
               .style("font-size", "16px")
               .style("font-weight", "bold") 
               .text("Date");


    timelineSvg.append("text")
               .attr("transform", "rotate(-90)")
               .attr("y", margin.left - 120)
               .attr("x", 0 - (height / 2))
               .attr("dy", "1em")
               .style("text-anchor", "middle")
               .style("font-size", "16px")
               .style("font-weight", "bold") 
               .text("News Source");


    let legendData = [
        { label : "Postitive", color : "#39CD39"},
        {label : "Negative", color : "#FF7983"},
        {label : "Neutral", color : "#60C5F5"}
    ];

    let legend = timelineSvg.append("g").attr("transform", `translate(${width - margin.right - 100}, 0)`);

    legend.selectAll("rect")
          .data(legendData)
          .enter()
          .append("rect")
          .attr("x", 0)
          .attr("y", (d,i) => i * 25)
          .attr("width", 20)
          .attr("height", 20)
          .attr("fill", d => d.color);
          
    legend.selectAll("text")
          .data(legendData)
          .enter()
          .append("text")
          .attr("x", 25)
          .attr("y", (d,i) => i * 25 + 15)
          .text(d => d.label)
          .attr("font-family", "Arial")
          .attr("font-size", "14px");
                              
}