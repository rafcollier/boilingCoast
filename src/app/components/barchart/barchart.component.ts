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
  pageviews: Array<any> = [];
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
     "max": 10
   }

   console.log(this.inputAll); 
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

  public printTemp(data) {
    console.log("data is" + data);
  }

  public onButtonOneClick() {
    this.callAnalytics(0);
  }

  public onButtonTwoClick() {
    this.callAnalytics(1);
  }

  public onButtonThreeClick() {
    this.callAnalytics(2);
  }

  public onButtonFourClick() {
    this.callAnalytics(3);
  }

  public onButtonFiveClick() {
    this.callAnalytics(4);
  }

  public callAnalytics(index) {
    this.showData = true;
    this.onUniquePageviewsSubmit(this.inputAll["views"][index]);
  }

  public onUniquePageviewsSubmit(view) {
    let topPagesArray = [];
    this.authService.getUniquePageviews(this.inputAll["firstDays"][0], this.inputAll["lastDays"][0], this.inputAll["metric2"], this.inputAll["dimension"], this.inputAll["sort"], this.inputAll["max"], this.inputAll["token"], view["id"]).subscribe(data => {
      console.log(data);
      for(var i=0; i<this.inputAll["max"]; i++) {
        topPagesArray.push({"url": data.rows[i][0], "views": data.rows[i][1]}); 
      }
      this.topPages = topPagesArray;
      this.onCountryDataSubmit(view);
      },
      err => {
        console.log(err);
        return false;
      });
    this.refreshBindings();
  }

  public onCountryDataSubmit(view) {
    let topCountrysArray = [];
    this.authService.getCountryData(this.inputAll["firstDays"][0], this.inputAll["lastDays"][0], this.inputAll["metric3"], this.inputAll["dimension2"], this.inputAll["sort2"], this.inputAll["max"], this.inputAll["token"], view["id"]).subscribe(data => {
      console.log(data);
      for(var i=0; i<this.inputAll["max"]; i++) {
        topCountrysArray.push({"country": data.rows[i][0], "views": data.rows[i][1]}); 
      }
      this.topCountrys = topCountrysArray;
      this.onSourceDataSubmit(view);
      },
      err => {
        console.log(err);
        return false;
      });
    this.refreshBindings();
  }

  public onSourceDataSubmit(view) {
  let topSourcesArray = [];
  this.authService.getSourceData(this.inputAll["firstDays"][0], this.inputAll["lastDays"][0], this.inputAll["metric1"], this.inputAll["dimension3"], this.inputAll["sort3"], this.inputAll["max"], this.inputAll["token"], view["id"]).subscribe(data => {
    console.log(data);
    for(var i=0; i<this.inputAll["max"]; i++) {
      topSourcesArray.push({"source": data.rows[i][0], "views": data.rows[i][1]}); 
    }
    this.topSources = topSourcesArray;
    this.onDeviceDataSubmit(view);
    },
    err => {
      console.log(err);
      return false;
    });
    this.refreshBindings();
  }

  public onDeviceDataSubmit(view) {
    let devicesArray = [];
    this.authService.getDeviceData(this.inputAll["firstDays"][0], this.inputAll["lastDays"][0], this.inputAll["metric1"], this.inputAll["dimension4"], this.inputAll["sort3"], this.inputAll["max"], this.inputAll["token"], view["id"]).subscribe(data => {
      console.log(data);
      for(var i=0; i<3; i++) { //only need 3: mobile, desktop, tablet
        devicesArray.push({"device": data.rows[i][0], "views": data.rows[i][1]}); 
        console.log(data.rows[i]);
      }
      this.devices = devicesArray;
      this.onAnalyticsSubmit(view, devicesArray);
      },
      err => {
        console.log(err);
        return false;
      });
    this.refreshBindings();
  }


  public onAnalyticsSubmit(view, devicesArray) {
    console.log("In onAnalyticsSubmit");
    var pageviewArray = [];
    var count = 0;

    for (var i = 0; i < this.inputAll["firstDays"].length; i++) {

     this.authService.getGoogleData(this.inputAll["firstDays"][i], this.inputAll["lastDays"][i], this.inputAll["metric1"], this.inputAll["token"], view["id"]).subscribe(data => {
        count++;
        pageviewArray.push({"pageName" : view["name"], "views": parseInt(data.totalsForAllResults["ga:pageviews"]), "month": data.query["start-date"]});

        //sort array if arrived out of sequence
        if(count == this.inputAll["firstDays"].length) {
          pageviewArray.sort((a,b) => {
            if(a.month < b.month)
              return -1;
            if(a.month > b.month)
              return 1;
            return 0;
          });
        console.log(pageviewArray); 
        this.createChart(pageviewArray, devicesArray, view);
        }  
      },
      err => {
        console.log(err);
        return false;
      });
    }
    this.refreshBindings();
  }

    
  public createChart(dataset, devicesArray, view) {

    console.log("in createChart");
    console.log(dataset);
    console.log(devicesArray);
    console.log(view);
    const cmajNewsScale = 0.022;
    const cmajBlogsScale = 0.05;
    const cmajCaScale = 0.0015;
    const cmajOpenScale = 0.025;
    const cmajMobileScale = 0.0055;

      d3.selectAll("svg").remove();

      var w = 500;
      var h = 500;
      var barPadding = 3;

      var svg = d3.select("#barchart1")
        .append("svg")
        .attr("width", w)
        .attr("height", h)
        .attr("align", "center");


      svg.selectAll("rect")  
        .data(dataset)
        .enter()
        .append("rect")
        .attr("x", function(d, i) {
          return i * (w / dataset.length);
        })
        .attr("y", function(d) {
          if(d["pageName"] == "CMAJ News")
            return h - (d["views"] * cmajNewsScale);
          if(d["pageName"] == "CMAJ Blogs")
            return h - (d["views"] * cmajBlogsScale);
          if(d["pageName"] == "CMAJ.CA")
            return h - (d["views"] * cmajCaScale);
          if(d["pageName"] == "CMAJ Open")
            return h - (d["views"] * cmajOpenScale);
          if(d["pageName"] == "CMAJ Mobile")
            return h - (d["views"] * cmajMobileScale);
          else
            return h - (d["views"] * 0.002);
        })
        .attr("width", w /dataset.length - barPadding)
        .attr("height", function(d) {
         if(d["pageName"] == "CMAJ News")
            return d["views"] * cmajNewsScale;
          if(d["pageName"] == "CMAJ Blogs")
            return d["views"] * cmajBlogsScale;
          if(d["pageName"] == "CMAJ.CA")
            return d["views"] * cmajCaScale;
          if(d["pageName"] == "CMAJ Open")
            return d["views"] * cmajOpenScale;
          if(d["pageName"] == "CMAJ Mobile")
            return d["views"] * cmajMobileScale;
          else
            return d["views"] * 0.002;
        })
        .attr("fill", "#DE8D47");
      
      svg.selectAll("text.values")
        .data(dataset)
        .enter()
        .append("text")
        .text(function(d) {
          return (d["views"] * 0.001).toFixed(1);
        })
        .attr("x", function (d, i) {
          return i * (w / dataset.length) + 25;
        })
        .attr("y", function (d) {
          if(d["pageName"] == "CMAJ News")
            return h - (d["views"] * cmajNewsScale) - 10;
          if(d["pageName"] == "CMAJ Blogs")
            return h - (d["views"] * cmajBlogsScale) - 10;
          if(d["pageName"] == "CMAJ.CA")
            return h - (d["views"] * cmajCaScale) - 10;
          if(d["pageName"] == "CMAJ Open")
            return h - (d["views"] * cmajOpenScale) - 10;
          if(d["pageName"] == "CMAJ Mobile")
            return h - (d["views"] * cmajMobileScale) - 10;
          else
            return h - (d["views"] * 0.02) - 10;
        })
        .attr("font-family", "arial")
        .attr("font-size", "16px")
        .attr("fill", "white");

      svg.selectAll("text.labels")
        .data(dataset)
        .enter()
        .append("text")
        .text(function(d) {
          return d["month"].slice(0,7);
        })
        .attr("x", function (d, i) {
          return i * (w / dataset.length) + 15;
        })
        .attr("y", function (d) {
          return h - 5;
        })
        .attr("font-family", "arial")
        .attr("font-size", "14px")
        .attr("fill", "white");


    var w2 = 300;
    var h2 = 500;
    var barPadding2 = 3;

    var svg2 = d3.select("#barchart2")
      .append("svg")
      .attr("width", w2)
      .attr("height", h2)
      .attr("align", "center");


    svg2.selectAll("rect")  
      .data(devicesArray)
      .enter()
      .append("rect")
      .attr("x", function(d, i) {
        return i * (w2 / devicesArray.length);
      })
      .attr("y", function(d) {
        if(view["name"] == "CMAJ News")
          return h2 - (d["views"] * (cmajNewsScale * 2));
        if(view["name"] == "CMAJ Blogs")
          return h2 - (d["views"] * (cmajBlogsScale * 1.6));
          //return h2 - (d["views"] * (0.8));
        if(view["name"] == "CMAJ.CA")
          return h2 - (d["views"] * (cmajCaScale * 1.4));
        if(view["name"] == "CMAJ Open")
          return h2 - (d["views"] * (cmajOpenScale * 1.2));
        if(view["name"] == "CMAJ Mobile")
          return h2 - (d["views"] * (cmajMobileScale * 1.5));
        else
          return h2 - (d["views"] * 0.002);
      })   
      .attr("width", w2 /devicesArray.length - barPadding2)
      .attr("height", function(d) {
        return (d["views"] * 0.08);
      })
      .attr("fill", "#DE8D47");
      
    svg2.selectAll("text.values")
      .data(devicesArray)
      .enter()
      .append("text")
      .text(function(d) {
        return d["views"];
      })
      .attr("x", function (d, i) {
        return i * (w2 / devicesArray.length) + 25;
      })
      .attr("y", function (d) {
        if(view["name"] == "CMAJ News")
          return h2 - (d["views"] * (cmajNewsScale * 2)) - 10;
        if(view["name"] == "CMAJ Blogs")
          return h2 - (d["views"] * (cmajBlogsScale * 1.6)) - 10;
        if(view["name"] == "CMAJ.CA")
          return h2 - (d["views"] * (cmajCaScale * 1.4)) - 15;
        if(view["name"] == "CMAJ Open")
          return h2 - (d["views"] * (cmajOpenScale * 1.2)) - 10;
        if(view["name"] == "CMAJ Mobile")
          return h2 - (d["views"] * (cmajMobileScale * 1.5)) - 10;
        else
          return h2 - (d["views"] * 0.002);
      })   
      .attr("font-family", "arial")
      .attr("font-size", "16px")
      .attr("fill", "white");

    svg2.selectAll("text.labels")
      .data(devicesArray)
      .enter()
      .append("text")
      .text(function(d) {
        return d["device"];
      })
      .attr("x", function (d, i) {
        return i * (w2 / devicesArray.length) + 15;
      })
      .attr("y", function (d) {
        return h2 - 5;
      })
      .attr("font-family", "arial")
      .attr("font-size", "14px")
      .attr("fill", "white");

    //let dataset3 = [
    //             {"label":"one", "value":20}, 
    //             {"label":"two", "value":50}, 
    //             {"label":"three", "value":30}
    //           ];
    //console.log(dataset3);
//
//    
//    var w3:number = 300;
//    var h3:number = 300;
//    var radius:number = Math.min(w3, h3)/2; 
//
//    console.log(w3, h3, radius);
//
//    var color:any = d3.scaleOrdinal()
//      .range(["#2C93E8","#838690","#F56C4E"]);
//
//    console.log(color);
//
//    var svg3:any = d3.select("#piechart1")
//      .append("svg:svg")
//      .data([dataset3])
//        .attr("width", w3)
//        .attr("height", h3)
//      .append("svg:g")
//        .attr("transform", "translate(" + radius + "," + radius + ")");
//
//
//    var arc:any = d3.arc()
//      .outerRadius(radius)
//

    //var pie:any = d3.pie()(data.map(function(d) { return d["presses"];}))

    //var arc:any = d3.arc()
    //  .innerRadius(0)
    //  .outerRadius(radius);

    //var labelArc: any = d3.arc()
    //  .outerRadius(radius - 40)
    //  .innerRadius(radius - 40);

    //var path:any = svg.selectAll("path")
    //  .data(pie)
    //  .enter()
    //  .append("path")
    //  .attr('d', arc)
    //  .style("fill", function(d) {return color(d.data["letter"]);});


    //var path = svg.selectAll('path')
     // .data(pie(data))
     // .enter()
     // .append('path')
     // .attr('d', arc)
     // .attr('fill', function(d, i) {
     //   return color(d.data.label)
     // })

      //this.createPieChart();

      this.refreshBindings();

  }

  public createPieChart() {
    
    let w = 300;
    let h = 300;
    let r = 100;

    let color = d3.scaleOrdinal()
      .range(["#2C93E8","#838690","#F56C4E"]);

    let data = [{"label":"one", "value":20}, 
                {"label":"two", "value":50}, 
                {"label":"three", "value":30}];

    console.log(data);

    let svg = d3.select("#piechart1")
      .append("svg")
      .data([data])
        .attr("width", w)
        .attr("height", h)
      .append("g") 
        .attr("transform", "translate(" + r + "," + r + ")")       

   let arc = d3.arc()        
      .innerRadius(0)
      .outerRadius(r);

    let pie = d3.pie()
      .value(function(d) {return d["value"];})
      .sort(null);










    this.refreshBindings();


  }






  public refreshBindings() {
    this.zone.run(() => this.showData = true);
  }


}
