import { Component, OnInit, OnChanges, ViewChild, ElementRef, Input, ViewEncapsulation, NgZone, ChangeDetectorRef } from '@angular/core';
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

  pieChartColors: Array <any> = ["#EC7063", "#AF7AC5", "#5DADE2", "#48C9B0", "#F5B041", "#F4D03F", "#AAB7B8"];
  viewIndex: any = 0;
  showDataNews: Boolean = true;
  showDataMain: Boolean = false;
  showDataBlogs: Boolean = false;
  inputAll = {};
  pageviewsArray: Array<any> = [];
  usersArray: Array<any> = [];
  topPages: Array<any> = [];
  topSources: Array<any> = [];
  topDevices: Array<any> = [];
  topCountries: Array<any> = [];
  
  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService,
    private zone: NgZone,
    private ref: ChangeDetectorRef
  ) { }

  ngOnInit() {

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
     "metric4": "users",
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
   this.onButtonOneClick();
  }
  

  //Get form data passed in from enterkey component as routing parameters
  getInputData() {
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

  //Get Array of previous months (first or last days)
  getDates(day) {
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
 
  //News button 
  public onButtonOneClick() {
    this.showDataNews = true;
    this.showDataMain = false;
    this.showDataBlogs = false; 
    this.callAnalyticsCommon(1, "chartTopSourcesNews", "chartTopPageviewsNews", "chartTopDevicesNews", "chartTopCountriesNews", "chartTopUsersNews", 0, 0.015, 0.030);
  }
  //CMAJ.CA button
  public onButtonTwoClick() {
    this.showDataNews = false;
    this.showDataMain = true;
    this.showDataBlogs = false;
    this.callAnalyticsCommon(0, "chartTopSourcesMain", "chartTopPageviewsMain", "chartTopDevicesMain", "chartTopCountriesMain", "chartTopUsersMain", 0, 0.0012, 0.0025);
  }

  //CMAJ Blogs button
  public onButtonThreeClick() {
    this.showDataBlogs = true;
    this.showDataMain = false;
    this.showDataNews = false;
    this.callAnalyticsCommon(2, "chartTopSourcesBlogs", "chartTopPageviewsBlogs", "chartTopDevicesBlogs", "chartTopCountriesBlogs", "chartTopUsersBlogs", 0, 0.02, 0.04);
  }

 
  public callAnalyticsCommon(viewIndex, chartID1, chartID2, chartID3, chartID4, chartID5, count, scale1, scale2) {
    this.onSourceDataSubmit(this.inputAll["views"][viewIndex], chartID1);  
    this.onPageviewsDataSubmit(this.inputAll["views"][viewIndex], chartID2, count, scale1);
    this.onUserDataSubmit(this.inputAll["views"][viewIndex], chartID5, count, scale2);
    this.onDeviceDataSubmit(this.inputAll["views"][viewIndex], chartID3);
    this.onUniquePageviewsSubmit(this.inputAll["views"][viewIndex]);
    this.onCountriesDataSubmit(this.inputAll["views"][viewIndex], chartID4);
  }


  public onPageviewsDataSubmit(view, chartID, count, chartScale) {

    this.authService.getGoogleData(this.inputAll["firstDays"][count], 
                                   this.inputAll["lastDays"][count], 
                                   this.inputAll["metric1"], 
                                   this.inputAll["token"], 
                                   view["id"]).subscribe(data => {
      this.pageviewsArray.push({"pageName" : view["name"], 
                                "views": parseInt(data.totalsForAllResults["ga:pageviews"]), 
                                "month": data.query["start-date"]}
                              );
      if (count < 5) {
        setTimeout(() => {
          this.onPageviewsDataSubmit(view, chartID, count + 1, chartScale); 
        }, 300);
      }
      else {
        this.createBarChart(this.pageviewsArray.reverse(), chartID, chartScale); 
        this.pageviewsArray =[];
        this.ref.detectChanges();
      }
    },
      err => {
        console.log(err);
        return false;
    });

  }

  public onUserDataSubmit(view, chartID, count, chartScale) {

    this.authService.getUserData(this.inputAll["firstDays"][count], 
                                   this.inputAll["lastDays"][count], 
                                   this.inputAll["metric4"], 
                                   this.inputAll["token"], 
                                   view["id"]).subscribe(data => {
                                     console.log(data);
      this.usersArray.push({"pageName" : view["name"], 
                                "views": parseInt(data.totalsForAllResults["ga:users"]), 
                                "month": data.query["start-date"]}
                              );
      if (count < 5) {
        setTimeout(() => {
          this.onUserDataSubmit(view, chartID, count + 1, chartScale); 
        }, 300);
      }
      else {
        this.createBarChart(this.usersArray.reverse(), chartID, chartScale); 
        this.usersArray =[];
      }
    },
      err => {
        console.log(err);
        return false;
    });

  }

  public onUniquePageviewsSubmit(view) {

    this.topPages = [];
    this.authService.getUniquePageviews(this.inputAll["firstDays"][0], 
                                        this.inputAll["lastDays"][0], 
                                        this.inputAll["metric2"], 
                                        this.inputAll["dimension"], 
                                        this.inputAll["sort"], 
                                        this.inputAll["max"], 
                                        this.inputAll["token"], 
                                        view["id"]).subscribe(data => {
      for(var i=0; i<this.inputAll["max"]; i++) {
        this.topPages.push({"url": data.rows[i][0], "views": data.rows[i][1]}); 
      }
      this.ref.detectChanges();
    },
    err => {
      console.log(err);
      return false;
    });

  }

  public onSourceDataSubmit(view, chartID) {

    this.topSources = [];
    this.authService.getSourceData(this.inputAll["firstDays"][0], 
                                   this.inputAll["lastDays"][0], 
                                   this.inputAll["metric1"], 
                                   this.inputAll["dimension3"], 
                                   this.inputAll["sort3"], 
                                   this.inputAll["maxSources"], 
                                   this.inputAll["token"], 
                                   view["id"]).subscribe(data => {

      for(var i=0; i<this.inputAll["maxSources"]; i++) {
        this.topSources.push({"source": data.rows[i][0], "views": data.rows[i][1], "color": this.pieChartColors[i]}); 
      }
      this.ref.detectChanges();
      this.createPieChart(this.topSources, chartID);
     
    },
    err => {
      console.log(err);
      return false;
    });

  }

  public onDeviceDataSubmit(view, chartID) {

    this.topDevices = [];
    this.authService.getDeviceData(this.inputAll["firstDays"][0], 
      this.inputAll["lastDays"][0], 
      this.inputAll["metric1"], 
      this.inputAll["dimension4"], 
      this.inputAll["sort3"], 
      this.inputAll["max"], 
      this.inputAll["token"], 
      view["id"]).subscribe(data => {
      for(var i=0; i<3; i++) { //only need 3: mobile, desktop, tablet
        this.topDevices.push({"device": data.rows[i][0], "views": data.rows[i][1], "color": this.pieChartColors[i]}); 
      }
      this.ref.detectChanges();
      this.createPieChart(this.topDevices, chartID);
    },
    err => {
      console.log(err);
      return false;
    });
  } 

  public onCountriesDataSubmit(view, chartID) {
    this.topCountries = [];
    this.authService.getCountryData(this.inputAll["firstDays"][0], 
                                    this.inputAll["lastDays"][0], 
                                    this.inputAll["metric3"], 
                                    this.inputAll["dimension2"], 
                                    this.inputAll["sort2"], 
                                    this.inputAll["maxCountries"], 
                                    this.inputAll["token"], 
                                    view["id"]).subscribe(data => {
      for(var i=0; i<this.inputAll["maxCountries"]; i++) {
        this.topCountries.push({"country": data.rows[i][0], "views": data.rows[i][1], "color": this.pieChartColors[i]}); 
      }
      this.ref.detectChanges();
      this.createPieChart(this.topCountries, chartID);
      
    },
    err => {
      console.log(err);
      return false;
    });
  }

  public createBarChart(dataset, chartID, scale) {

    let w = 500;
    let h = 500;
    let barPadding = 3; 

    d3.select("#" + chartID).selectAll("svg").remove(); 

    let svg = d3.select("#" + chartID)
      .append("svg")
      .attr("id", chartID)
      .attr("width", w)
      .attr("height", h + 30)
      .attr("align", "center");

    svg.selectAll("rect")  
      .data(dataset)
      .enter()
      .append("rect")
      .attr("x", function(d, i) {
        return i * (w / dataset.length);
      })
      .attr("y", function(d) {
          return h - (d["views"] * scale);
      })
      .attr("width", w /dataset.length - barPadding)
      .attr("height", function(d) {
          return (d["views"] * scale);
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
            return h - (d["views"] * scale) - 10;
        })
        .attr("font-family", "arial")
        .attr("font-size", "16px")
        .attr("fill", "black");

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
          return h + 15;
        })
        .attr("font-family", "arial")
        .attr("font-size", "14px")
        .attr("fill", "black");

  }
  
  
  public createPieChart(dataset, chartID) {

    let w = 400;
    let h = 400;
    let r = Math.min(w,h)/2; 
    let innerR = r - 50;
    let outerR = r - 10;
    let pieChartColors = this.pieChartColors; 

    d3.select("#" + chartID).selectAll("svg").remove(); 

    let arc = d3.arc()
      .outerRadius(r - 10)
      .innerRadius(0);

    let labelArc = d3.arc()
      .outerRadius(r - 40)
      .innerRadius(r - 40);

    let pie = d3.pie()
      .sort(null)
      .value((function (d:any) {return d}));

    d3.select("#" + chartID).selectAll("svg").remove(); 

    let svg = d3.select("#" + chartID)
        .append("svg")
        .attr("id", chartID)
        .attr("width", w)
        .attr("height", h + 30)
        .attr("align", "center")
        .append("g")
        .attr("transform", "translate(" + w / 2 + "," + h / 2 + ")");

      let values = dataset.map(data => data.views);
   
      let g = svg.selectAll(".arc")
        .data(pie(values))
        .enter().append("g")
        .attr("class", "arc");

      g.append("path")
        .attr("d", <any>arc)
        .style("fill", function(d, i)  {
          return pieChartColors[i];
        });

  }

}