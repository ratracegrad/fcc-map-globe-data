$(document).ready(function() {
    var width = 1020;
    var height = 960;
    var hue = 0;
    var colors = {};

    var projection = d3.geo.mercator()
            .scale((width + 1) / 2 / Math.PI)
            .translate([width / 2, height / 2])
            .precision(.1);

    var path = d3.geo.path()
            .projection(projection);

    var graticule = d3.geo.graticule();

    var svg = d3.select(".chart").append("svg")
            .attr("width", width)
            .attr("height", height);

    svg.append("path")
            .datum(graticule)
            .attr("class", "graticule")
            .attr("d", path);

    // display map of world
    d3.json("world-50m.json", function(error, world) {
        if (error) throw error;

        svg.insert("path", ".graticule")
                .datum(topojson.feature(world, world.objects.land))
                .attr("class", "land")
                .attr("d", path);

        svg.insert("path", ".graticule")
                .datum(topojson.mesh(world, world.objects.countries, function(a, b) { return a !== b; }))
                .attr("class", "boundary")
                .attr("d", path);
    });

    // display meteorite strikes on top of our map of the world
    d3.json('meteorite-strike-data.json', function(error, meteorite) {
        if (error) throw error;

        meteorite.features.sort(function(a,b) {
            return new Date(a.properties.year) - new Date(b.properties.year);
        })
        meteorite.features.map(function(e) {
            hue+=.35;
            colors[e.properties.year] = hue;
            e.color = 'hsl(' + hue + ',100%, 50%)';
        })

        meteorite.features.sort(function(a,b) {
            return b.properties.mass - a.properties.mass
        })

        meteorites = svg.append('g')
                .selectAll('path')
                .data(meteorite.features)
                .enter()
                .append('circle')
                .attr('cx', function(d) { return projection([d.properties.reclong,d.properties.reclat])[0] })
                .attr('cy', function(d) { return projection([d.properties.reclong,d.properties.reclat])[1] })
                .attr('r', function(d) {
                    var range = 718750/2/2;

                    if (d.properties.mass <= range) return 2;
                    else if (d.properties.mass <= range*2) return 10;
                    else if (d.properties.mass <= range*3) return 20;
                    else if (d.properties.mass <= range*20) return 30;
                    else if (d.properties.mass <= range*100) return 40;
                    return 50;
                })
                .attr('fill-opacity', function(d) {
                    var range = 718750/2/2;
                    if (d.properties.mass <= range) return 1;
                    return .5;
                })
                .attr('stroke-width', 1)
                .attr('stroke', '#EAFFD0')
                .attr('fill', function(d) { return d.color })
                .on('mouseover', function(d) {
                    d3.select(this).attr('d', path).style('fill', 'black');
                    // Show tooltip
                    div.transition()
                            .duration(200)
                            .style('opacity', .9);
                    div.html( '<span class="def">fall:</span> ' + d.properties.fall + '<br>' +
                              '<span class="def">mass:</span> ' + d.properties.mass + '<br>' +
                              '<span class="def">name:</span> ' + d.properties.name + '<br>' +
                              '<span class="def">nametype:</span> ' + d.properties.nametype + '<br>' +
                              '<span class="def">recclass:</span> ' + d.properties.recclass + '<br>' +
                              '<span class="def">reclat:</span> ' + d.properties.reclat + '<br>' +
                              '<span class="def">year:</span> ' + d.properties.year + '<br>')
                            .style('left', (d3.event.pageX+30) + 'px')
                            .style('top', (d3.event.pageY/1.5) + 'px')
                })
                .on('mouseout', function(d) {
                    // Reset color of dot
                    d3.select(this).attr('d', path).style('fill', function(d) { return d.properties.hsl });

                    // Fade out tooltip
                    div.transition()
                            .duration(500)
                            .style('opacity', 0);
                });

        // Initialize map sizes
        sizeChange();
    });

})