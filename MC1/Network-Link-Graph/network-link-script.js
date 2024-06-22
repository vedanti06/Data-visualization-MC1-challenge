
function processDataType(d) {
    for (var i = 0; i < d.length; i++) {
        d[i]['impOfPeople'] = parseFloat(d[i]['impOfPeople']);
        d[i]['impOforganization'] = parseFloat(d[i]['impOforganization']);
        d[i]['clusterSize'] = parseFloat(d[i]['clusterSize']);
    }
    return d;
}


function groupByOrganization(d) {
    const organizationClusters = [];
    d.forEach(element => {
        if (!organizationClusters[element.organization]) {
            organizationClusters[element.organization] = [];
        }
        organizationClusters[element.organization].push(element);
    });
    return organizationClusters;
}


document.addEventListener('DOMContentLoaded', function () {
    Promise.all([
        d3.csv('Resume-Data.csv'),
        d3.csv('linksOfficial.csv'), 
        d3.csv('linksUnofficial.csv')
    ]).then(function (values) {
        const resumeData = processDataType(values[0]);
        const nodeGroups = groupByOrganization(resumeData);
        const linksOfficialData = values[1];
        const linksUnofficialData = values[2];
        console.log(resumeData);
        console.log(nodeGroups);
        console.log(linksOfficialData);
        plotClusters(resumeData, nodeGroups, linksOfficialData,linksUnofficialData);
    });
});


function plotClusters(resumeData, nodeGroups, linksOfficialData, linksUnofficialData) {

    const margin = { top: 50, right: 30, bottom: 120, left: 60 },
        width = 750 - margin.left - margin.right,
        height = 850 - margin.top - margin.bottom;

    const colorScale = d3.scaleOrdinal(d3.schemeDark2);

    const svg = d3.select("#plotSvg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const tooltip = d3.select("#plotDiv")
        .append("div")
        .attr("class", "d3-tooltip");


    const getcirclePositionAttributes = (organization) => {
        const pentagonRadius = 280; 
        const angleOffset = Math.PI / 2; 
        const angleStep = (2 * Math.PI) / 7;

        const positions = {
            'POKMember': { angle: 0 },
            'GASTechCommittee': { angle: angleStep },
            'GASTechBoard': { angle: 2 * angleStep },
            'GASTechEmployee': { angle: 3 * angleStep },
            'POKCommittee': { angle: 4 * angleStep },
            'APA': { angle: 5 * angleStep },
            'Government': { angle: 6 * angleStep },
        };

        return {
            cx: 0.5 * width + pentagonRadius * Math.cos(angleOffset + positions[organization].angle),
            cy: 0.5 * height + pentagonRadius * Math.sin(angleOffset + positions[organization].angle),
            r: 70, 
        };
    };
    

    const simulation = d3.forceSimulation(resumeData)
    simulation
        .force("x", d3.forceX().strength(0.05).x(d => {
            const organization = d.organization;
            const circlePosition = getcirclePositionAttributes(organization);
            return circlePosition.cx; 
        }))
        .force("y", d3.forceY().strength(0.05).y(d => {
            const organization = d.organization;
            const circlePosition = getcirclePositionAttributes(organization);
            return circlePosition.cy;
        }))
        .force("collide", d3.forceCollide().radius(d => (d.impOfPeople / 9) * 20 + 9));
        
    simulation.alpha(1).alphaMin(0.0001)
    while (simulation.alpha() > simulation.alphaMin()) {
        simulation.tick();
    }
    simulation.stop()


    svg.selectAll(".link")
        .data(linksOfficialData.filter(d => parseFloat(d.frequency)>5))
        .enter().append("line")  
        .attr("class", "link")
        .attr("stroke", "lightgreen")
        .attr("stroke-width", 1)
        .attr("x1", d => getXCoordinate(d.source))
        .attr("y1", d => getYCoordinate(d.source))
        .attr("x2", d => getXCoordinate(d.target))
        .attr("y2", d => getYCoordinate(d.target))
        .on("mouseover", function (event, d) {
            
            d3.select(this).style("stroke", "green"); 
    
            circles.filter(node => node.name === d.source || node.name === d.target)
                .transition()
                .style("opacity", 1); 
    
            svg.selectAll(".link")
                .filter(link => link !== d)
                .transition()
                .style("opacity", 0.1);
    
            circles.filter(node => node.name !== d.source && node.name !== d.target)
                .transition()
                .style("opacity", 0.1);
    
            tooltip.html(`Source: ${d.source} <br>Target: ${d.target}`)
                .style("opacity", 0.9)
                .style("left", (event.pageX + 15) + "px")
                .style("top", (event.pageY - 15) + "px");
        })
        .on("mouseout", function () {
            d3.select(this).style("stroke", null); 
    
            svg.selectAll(".link")
                .transition()
                .style("opacity", 1);
    
            circles.transition()
                .style("opacity", 1);
    
            tooltip.html("")
                .style("opacity", 0);
        });


       
        console.log(linksUnofficialData);
        console.log("Hi");

        svg.selectAll(".link1")
        .data(linksUnofficialData.filter(d => parseFloat(d.frequency)))
        .enter().append("line") 
        .attr("class", "link1")
        .attr("stroke", "pink")
        .attr("stroke-width", 1)
        .attr("x1", d => getXCoordinate(d.source))
        .attr("y1", d => getYCoordinate(d.source))
        .attr("x2", d => getXCoordinate(d.target))
        .attr("y2", d => getYCoordinate(d.target))
        .on("mouseover", function (event, d) {
            d3.select(this).style("stroke", "red"); 
    
            circles.filter(node => node.name === d.source || node.name === d.target)
                .transition()
                .style("opacity", 1); 
    
            svg.selectAll(".link1")
                .filter(link => link !== d)
                .transition()
                .style("opacity", 0.1);
    
            circles.filter(node => node.name !== d.source && node.name !== d.target)
                .transition()
                .style("opacity", 0.1);
    
            
            tooltip.html(`Source: ${d.source} <br>Target: ${d.target}`)
                .style("opacity", 0.9)
                .style("left", (event.pageX + 15) + "px")
                .style("top", (event.pageY - 15) + "px");
        })
        .on("mouseout", function () {
            
            d3.select(this).style("stroke", null); 
    
            svg.selectAll(".link")
                .transition()
                .style("opacity", 1);
    
            circles.transition()
                .style("opacity", 1);
    
            
            tooltip.html("")
                .style("opacity", 0);
        });


        


    const circles = svg.selectAll(".node")
        .data(resumeData)
        .enter().append("circle")
        .attr("class", "node")
        .attr("stroke", "black")
        .attr("stroke-width", 2)
        .attr("cx", d => d.x)
        .attr("cy", d => d.y)
        .attr("fill", d => colorScale(d.organization))
        .attr("r", d => ((d.impOfPeople + 2) / 9) * 20)
        .on("mouseover", function (event, d) {
            
            svg.selectAll(".link")
                .transition()
                .style("opacity", link => (link.source === d || link.target === d) ? 1 : 0.1);

            circles.transition()
                .style("opacity", node => (node === d) ? 1 : 0.1);

            
            tooltip.html(`Name: ${d.name} <br>Role: ${d.role} <br>Organization: ${d.organization}`)
                .style("opacity", 0.9)
                .style("left", (event.pageX + 15) + "px")
                .style("top", (event.pageY - 15) + "px");
        })
        .on("mousemove", function (event) {
            
            tooltip.style("left", (event.pageX + 15) + "px")
                .style("top", (event.pageY - 15) + "px");
        })
        .on("mouseout", function () {
            
            svg.selectAll(".link")
                .transition()
                .style("opacity", 1);

            circles.transition()
                .style("opacity", 1);

            tooltip.html("")
                .style("opacity", 0);
        });


    function getXCoordinate(name) {
        let node = resumeData.find(d => d.name == name);
        node = Object(node)
        return node ? node.x : 0;
    }

    function getYCoordinate(name) {
        let node = resumeData.find(d => d.name == name);
        node = Object(node)
        return node ? node.y : 0;
    }


}
