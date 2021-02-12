const margin = {t: 50, r:50, b: 50, l: 50};
const size = {w: 800, h: 500};
const svg = d3.select('svg');

// defining a container group
// which will contain everything within the SVG
// we can transform it to make things everything zoomable
const containerG = svg.append('g').classed('container', true);
let mapData, covidData, hexbinPopData;
let radiusScale, projection, hexbin;
let bubblesG;

svg.attr('width', size.w)
    .attr('height', size.h);

// d3.zoom defines event from scrolling or double click
let zoom = d3.zoom()
    .scaleExtent([1,8])  // limit of zoom for the k value
    .on('zoom', zoomed);
svg.call(zoom);


Promise.all([
    d3.json('data/maps/us-states.geo.json'),
    d3.csv('data/covid_data.csv')
]).then(function (datasets) {
    mapData = datasets[0];
    covidData = datasets[1];

    // --------- DRAW MAP ----------
    // creating a group for map paths
    let mapG = containerG.append('g').classed('map', true);

    // defining a projection that we will use
    projection = d3.geoAlbersUsa()
        .fitSize([size.w, size.h], mapData);

    // defining a geoPath function
    let path = d3.geoPath(projection);

    // adding state paths
    mapG.selectAll('path')
        .data(mapData.features)
        .enter()
        .append('path')
        .attr('d', function(d) {
            return path(d);
        });

    // DRAW BUBBLES
    /// Add a group
    bubblesG = containerG.append('g').classed('bubbles', true);
    
    // need to make tw
    radiusScale = d3.scaleSqrt()
        .domain(d3.extent(covidData, d=> +d.cases)) 
        .range([1, 20]);

    // color scale for color
    colorScale = d3.scaleSequential()
        .domain(d3.extent(covidData, d => d.deaths))
        .interpolator(d3.interpolateCividis);
        
    drawBubbles();

});


    function drawBubbles(zoomScale = 1) {
        
        // creating a bubbles selection
        let bubblesSelection = bubblesG.selectAll('circle')
        .data(covidData, d => d.fips);


        // selecting tooltip
        let tooltip = d3.select('div#map-tooltip');
        
        // now add the circles
        bubblesSelection
            .data(covidData)
            .join('circle')
            .attr('cx',0 )
            .attr('cy', 0)
            .style('fill', d => colorScale(d.deaths))
            .attr('transform', function(d) {
                //translate(x,y)
                return `translate(${projection([+d.long, +d.lat])})`; 
     
            })
            .attr('r', d => radiusScale(+d.cases)/zoomScale)
            // updating tooltip information on hover
            .on('mouseover', (event, d) => {
                // changing display none to block
                tooltip.style('display', 'block');

                // setting up the tooltip with info
                tooltip.select('div.name')
                    .text(`${d.county}, ${d.state}`);
                    
                tooltip.select('div.cases')
                    .text("Cases = " + d.cases);
                tooltip.select('div.deaths')
                    .text("Deaths = " + d.deaths);

                // setting the position of the tooltip
                // to the location of event as per the page
                tooltip.style('top', (event.pageY+1)+'px')
                    .style('left', (event.pageX+1)+'px')

            })
            .on('mouseout', () => {
                // hide the tooltip
                // when mouse moves out of the circle
                tooltip.style('display', 'none');
            });

            
    }

// }






// ------------------------------------------------------------- //

// moved to bottom because usually these functions have a lot to them
// d3.zoom also lets you pan
function zoomed(event) { 
    console.log('zoomed', event);
    // event.transform = {x:1 , y: 2 k: 3} // use k to define zoom of map

    containerG.attr('transform', event.transform); // event.transform is saying to scale -- translate 

    // we want the stroke to visibly stay the same
    containerG.attr('stroke-width', 1/event.transform.k) // need to make it even by dividing by zoom s

    drawBubbles(event.transform.k);
};