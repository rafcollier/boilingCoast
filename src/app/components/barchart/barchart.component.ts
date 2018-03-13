import { Component, OnInit, OnChanges, ViewChild, ElementRef, Input, ViewEncapsulation, NgZone } from '@angular/core';
import * as d3 from 'd3';
import {Router} from '@angular/router';
import {ActivatedRoute} from '@angular/router';
import {AuthService} from '../../services/auth.service';

const config = require('../../../../../config/google');

@Component({
  selector: 'app-barchart',
  templateUrl: './barchart.component.html',
  styleUrls: ['./barchart.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class BarchartComponent implements OnInit {
  //@ViewChild('chart1') private chartContainer1: ElementRef;
  //@ViewChild('chart2') private chartContainer2: ElementRef;
  //data: Array<any> = [5, 12, 34, 56, 88];
  data: Array<any> = [8, 10, 6, 7, 15, 22];
  margin: any = { top: 20, bottom: 20, left: 20, right: 20};
  private chart: any;
  public width: number;
  private height: number;
  private xScale: any;
  private yScale: any;
  private colors: any;
  private xAxis: any;
  private yAxis: any;
  private sub: any;

  showData = false;
  inputAll = {};
  devices: Array<any> = [];
  pageviewsArray: Array<any> = [];
  topPages: Array<any> = [];
  topCountrys: Array<any> = [];
  topSources: Array<any> = [];
  
  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService,
    private zone: NgZone
  ) { }

  ngOnInit() {

   this.showData = false;
   let inputObj = this.getInputData();
   let firstDaysArr = this.getDates(inputObj["firstDay"]);
   let lastDaysArr = this.getDates(inputObj["lastDay"]);
   this.inputAll = {
     "token": inputObj["token"],
     "firstDays": firstDaysArr,
     "lastDays": lastDaysArr,
     "views" : [
        {"name": config.name1, "id": config.viewID1}, 
        {"name": config.name2, "id": config.viewID2}, 
        {"name": config.name3, "id": config.viewID3}, 
        {"name": config.name4, "id": config.viewID4}, 
        {"name": config.name5, "id": config.viewID5} 
     ],
     "metric1": "pageviews",
     "metric2": "uniquePageviews",
     "metric3": "sessions",
     "dimension": "pagePath",
     "dimension2": "country",
     "dimension3": "source",
     "dimension4": "deviceCategory",
     "sort": "uniquePageviews",
     "sort2": "sessions",
     "sort3": "pageviews",
     "max": 10,
     "maxSources": 7,
     "maxCountries": 7 
   }
   this.callAnalytics();
  }
  

  //Get form data passed in from enterkey component as routing parameters
  getInputData() {
    console.log("In getInputData");
    let dataInput = {};
    this.sub = this.route
    .queryParams
    .subscribe(params => {
      dataInput["token"] = params['token'];
      dataInput["firstDay"] = params['startDate'];
      dataInput["lastDay"] = params['endDate'];
    });
    return dataInput;
  }

  //Get Array of 5 previous months (first or last days)
  getDates(day) {
    console.log("In getDates");
    const num = 6;
    let objArr = []; 
    let strArr = []; 
    strArr[0] = day;
    objArr[0] = this.getDate(day);
    for(var i = 1; i < num; i++) {
      if(day.substr(8) == '01') { //First day of month
        objArr[i] = this.prevMonthFirst(objArr[i-1]);
      } else {
        const firstDay = this.prevMonthFirst(this.getDate(strArr[i-1].substr(0,8).concat('01'))); //get first day previous month
        objArr[i] = this.prevMonthLast(firstDay); //get last day previous month from the first day
      }
      strArr[i] = objArr[i].toISOString().substr(0,10);
    }
    return strArr; 
  }

  //Create data object when passed a date string: YYYY-MM-DD
  getDate(date) {
    const year = parseInt(date.slice(0,4));
    const month = parseInt(date.slice(5,7));
    const days = parseInt(date.substr(8));
    const newDate = new Date(year, month - 1, days);//
    return newDate;
  }

  //Calculate first day of the previous month when passed a date object
  prevMonthFirst(date) {
    var firstDate = new Date (date.getFullYear(), date.getMonth() -1, 1);
    return firstDate;
  }

  //Calculate last day of the previous month when passed a date object
  prevMonthLast(date) {
    var lastDate = new Date (date.getFullYear(), date.getMonth() + 1, 0);
    return lastDate;
  }

  public callAnalytics() {
    this.showData = true;
    this.onAnalyticsSubmit(this.inputAll["views"][0], 0);
  }

  public onAnalyticsSubmit(view, count) {
    console.log("In onAnalyticsSubmit");

    this.authService.getGoogleData(this.inputAll["firstDays"][count], this.inputAll["lastDays"][count], this.inputAll["metric1"], this.inputAll["token"], view["id"]).subscribe(data => {
      this.pageviewsArray.push({"pageName" : view["name"], "views": parseInt(data.totalsForAllResults["ga:pageviews"]), "month": data.query["start-date"]});

      if(count < 5) {
        this.onAnalyticsSubmit(view, count+1)
      }
      else {
        console.log(this.pageviewsArray);
        this.onUniquePageviewsSubmit(this.inputAll["views"][0]);
        return;
      }
    },
      err => {
        console.log(err);
        return false;
    });

    this.refreshBindings();
  }

  public onUniquePageviewsSubmit(view) {
    let topPagesArray = [];
    this.authService.getUniquePageviews(this.inputAll["firstDays"][0], this.inputAll["lastDays"][0], this.inputAll["metric2"], this.inputAll["dimension"], this.inputAll["sort"], this.inputAll["max"], this.inputAll["token"], view["id"]).subscribe(data => {
      console.log(data);
      for(var i=0; i<this.inputAll["max"]; i++) {
        topPagesArray.push({"url": data.rows[i][0], "views": data.rows[i][1]}); 
      }
      this.topPages = topPagesArray;
      this.onSourceDataSubmit(this.inputAll["views"][0]);
      },
      err => {
        console.log(err);
        return false;
      });
    this.refreshBindings();
    }


  public onSourceDataSubmit(view) {
    let topSourcesArray = [];
    let sourceColorArray = ["#EC7063", "#AF7AC5", "#5DADE2", "#48C9B0", "#F5B041", "#F4D03F", "#AAB7B8"];
    this.authService.getSourceData(this.inputAll["firstDays"][0], this.inputAll["lastDays"][0], this.inputAll["metric1"], this.inputAll["dimension3"], this.inputAll["sort3"], this.inputAll["maxSources"], this.inputAll["token"], view["id"]).subscribe(data => {
      console.log(data);
      for(var i=0; i<this.inputAll["maxSources"]; i++) {
        topSourcesArray.push({"source": data.rows[i][0], "views": data.rows[i][1], "color": sourceColorArray[i]}); 
      }
      this.topSources = topSourcesArray;
      this.onDeviceDataSubmit(this.inputAll["views"][0]);
      },
      err => {
        console.log(err);
        return false;
      });
    this.refreshBindings();
  }

  public onDeviceDataSubmit(view) {
    let devicesArray = [];
    let deviceColorArray = ["#FAA43A", "#5DA5DA", "#7F8C8D"];
    this.authService.getDeviceData(this.inputAll["firstDays"][0], this.inputAll["lastDays"][0], this.inputAll["metric1"], this.inputAll["dimension4"], this.inputAll["sort3"], this.inputAll["max"], this.inputAll["token"], view["id"]).subscribe(data => {
      console.log(data);
      for(var i=0; i<3; i++) { //only need 3: mobile, desktop, tablet
        devicesArray.push({"device": data.rows[i][0], "views": data.rows[i][1], "color": deviceColorArray[i]}); 
        console.log(data.rows[i]);
      }
      this.devices = devicesArray;
      this.onCountryDataSubmit(this.inputAll["views"][0]);
      },
      err => {
        console.log(err);
        return false;
      });

    this.refreshBindings();
  } 

  public onCountryDataSubmit(view) {
    let topCountrysArray = [];
    let countryColorArray = ["#EC7063", "#AF7AC5", "#5DADE2", "#48C9B0", "#F5B041", "#F4D03F", "#AAB7B8"];
    this.authService.getCountryData(this.inputAll["firstDays"][0], this.inputAll["lastDays"][0], this.inputAll["metric3"], this.inputAll["dimension2"], this.inputAll["sort2"], this.inputAll["maxCountries"], this.inputAll["token"], view["id"]).subscribe(data => {
      console.log(data);
      for(var i=0; i<this.inputAll["maxCountries"]; i++) {
        topCountrysArray.push({"country": data.rows[i][0], "views": data.rows[i][1], "color": countryColorArray[i]}); 
      }
      this.topCountrys = topCountrysArray;
      this.createChart();
      },
      err => {
        console.log(err);
        return false;
      });
    this.refreshBindings();
  }

  public createChart() {

    d3.select("svg").remove();
    d3.select("svg2").remove();
    d3.select("svg3").remove();
    d3.select("svg4").remove();
    d3.select("svg5").remove();

    console.log("in createChart");
    let dataset1 = this.pageviewsArray.reverse();
    console.log(dataset1);
    let w = 500;
    let h = 500;
    let barPadding = 3;

    let svg = d3.select("#barchartPageviews")
      .append("svg")
      .attr("width", w)
      .attr("height", h + 30)
      .attr("align", "center");


    svg.selectAll("rect")  
      .data(dataset1)
      .enter()
      .append("rect")
      .attr("x", function(d, i) {
        return i * (w / dataset1.length);
      })
      .attr("y", function(d) {
          return h - (d["views"] * 0.02);
      })
      .attr("width", w /dataset1.length - barPadding)
      .attr("height", function(d) {
          return (d["views"] * 0.02);
      })
      .attr("fill", "#DE8D47");
      
      svg.selectAll("text.values")
        .data(dataset1)
        .enter()
        .append("text")
        .text(function(d) {
          return (d["views"] * 0.001).toFixed(1);
        })
        .attr("x", function (d, i) {
          return i * (w / dataset1.length) + 25;
        })
        .attr("y", function (d) {
            return h - (d["views"] * 0.02) - 10;
        })
        .attr("font-family", "arial")
        .attr("font-size", "16px")
        .attr("fill", "black");

      svg.selectAll("text.labels")
        .data(dataset1)
        .enter()
        .append("text")
        .text(function(d) {
          return d["month"].slice(0,7);
        })
        .attr("x", function (d, i) {
          return i * (w / dataset1.length) + 15;
        })
        .attr("y", function (d) {
          return h + 15;
        })
        .attr("font-family", "arial")
        .attr("font-size", "14px")
        .attr("fill", "black");




      let w2 = 250;
      let h2 = 500;
      let dataset2 = this.devices;

      let svg2 = d3.select("#barchart2")
        .append("svg")
        .attr("width", w2)
        .attr("height", h2 + 30)
        .attr("align", "center");


      svg2.selectAll("rect")  
        .data(dataset2)
        .enter()
        .append("rect")
        .attr("x", function(d, i) {
          return i * (w2 / dataset2.length);
        })
        .attr("y", function(d) {
            return h2 - (d["views"] * 0.02);
        })
        .attr("width", w2 /dataset2.length - barPadding)
        .attr("height", function(d) {
            return (d["views"] * 0.02);
        })
        .attr("fill", "#DE8D47");
      
      svg2.selectAll("text.values")
        .data(dataset2)
        .enter()
        .append("text")
        .text(function(d) {
          return (d["views"] * 0.001).toFixed(1);
        })
        .attr("x", function (d, i) {
          return i * (w2 / dataset2.length) + 25;
        })
        .attr("y", function (d) {
            return h2 - (d["views"] * 0.02) - 10;
        })
        .attr("font-family", "arial")
        .attr("font-size", "16px")
        .attr("fill", "black");

      svg2.selectAll("text.labels")
        .data(dataset2)
        .enter()
        .append("text")
        .text(function(d) {
          return d["device"];
        })
        .attr("x", function (d, i) {
          return i * (w2 / dataset2.length) + 15;
        })
        .attr("y", function (d) {
          return h2 + 15;
        })
        .attr("font-family", "arial")
        .attr("font-size", "14px")
        .attr("fill", "black");

      let w3 = 400;
      let h3 = 400;
      let r1 = Math.min(w3,h3)/2; 
      let innerRadius = r1 - 50;
      let outerRadius = r1 - 10;
      let dataset3 = this.devices;
      let color = ["#FAA43A", "#5DA5DA", "#7F8C8D"]; 

      console.log(dataset3);

      let arc = d3.arc()
        .outerRadius(r1 - 10)
        .innerRadius(0);

      let labelArc = d3.arc()
        .outerRadius(r1 - 40)
        .innerRadius(r1 - 40);

      let pie = d3.pie()
        .sort(null)
        .value((function (d:any) {return d}));

      let svg3 = d3.select("#piechartDevices")
        .append("svg")
        .attr("width", w3)
        .attr("height", h3 + 30)
        .attr("align", "center")
        .append("g")
        .attr("transform", "translate(" + w3 / 2 + "," + h3 / 2 + ")");

      let values = dataset3.map(data => data.views);
      console.log(values);
   
      let g = svg3.selectAll(".arc")
        .data(pie(values))
        .enter().append("g")
        .attr("class", "arc");


      g.append("path")
        .attr("d", <any>arc)
        .style("fill", function(d, i)  {
          console.log(i);
          //return "#98abc5"; 
          return color[i];
        });


      let w4 = 400;
      let h4 = 400;
      let r2 = Math.min(w4,h4)/2; 
      let innerRadius2 = r2 - 50;
      let outerRadius2 = r2 - 10;
      let dataset4 = this.topSources;
      let colorSources = ["#EC7063", "#AF7AC5", "#5DADE2", "#48C9B0", "#F5B041", "#F4D03F", "#AAB7B8"]; 

      console.log(dataset4);

      let arc2 = d3.arc()
        .outerRadius(r2 - 10)
        .innerRadius(0);

      let labelArc2 = d3.arc()
        .outerRadius(r2 - 40)
        .innerRadius(r2 - 40);

      let pie2 = d3.pie()
        .sort(null)
        .value((function (d:any) {return d}));

      let svg4 = d3.select("#piechartSources")
        .append("svg")
        .attr("width", w4)
        .attr("height", h4 + 30)
        .attr("align", "center")
        .append("g")
        .attr("transform", "translate(" + w4 / 2 + "," + h4 / 2 + ")");

      let values2 = dataset4.map(data => data.views);
      console.log(values2);
   
      let g2 = svg4.selectAll(".arc")
        .data(pie2(values2))
        .enter().append("g")
        .attr("class", "arc");

      g2.append("path")
        .attr("d", <any>arc2)
        .style("fill", function(d, i)  {
          console.log(i);
          return colorSources[i];
        });


      let w5 = 400;
      let h5 = 400;
      let r3 = Math.min(w5,h5)/2; 
      let innerRadius3 = r3 - 50;
      let outerRadius3 = r3 - 10;
      let dataset5 = this.topCountrys;
      let colorCountry = ["#EC7063", "#AF7AC5", "#5DADE2", "#48C9B0", "#F5B041", "#F4D03F", "#AAB7B8"]; 

      console.log(dataset5);

      let arc3 = d3.arc()
        .outerRadius(r2 - 10)
        .innerRadius(0);

      let labelArc3 = d3.arc()
        .outerRadius(r3 - 40)
        .innerRadius(r3 - 40);

      let pie3 = d3.pie()
        .sort(null)
        .value((function (d:any) {return d}));

      let svg5 = d3.select("#piechartCountry")
        .append("svg")
        .attr("width", w5)
        .attr("height", h5 + 30)
        .attr("align", "center")
        .append("g")
        .attr("transform", "translate(" + w5 / 2 + "," + h5 / 2 + ")");

      let values3 = dataset5.map(data => data.views);
      console.log(values3);
   
      let g3 = svg5.selectAll(".arc")
        .data(pie3(values3))
        .enter().append("g")
        .attr("class", "arc");

      g3.append("path")
        .attr("d", <any>arc3)
        .style("fill", function(d, i)  {
          console.log(i);
          return colorCountry[i];
        });

        this.refreshBindings();

        return;
    
  }




  public refreshBindings() {
    this.zone.run(() => this.showData = true);
  }


}