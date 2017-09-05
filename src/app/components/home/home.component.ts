import { Component, OnInit, ElementRef, AfterViewInit, VERSION, NgZone } from '@angular/core';
import {AuthService} from '../../services/auth.service';
import {Router} from '@angular/router';
declare const gapi: any;
declare const FB: any;
const config = require('../../../../../config/google');


@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})

export class HomeComponent implements AfterViewInit {

  private scope = [
    'profile',
    'email',
    'https://www.googleapis.com/auth/plus.me',
    'https://www.googleapis.com/auth/contacts.readonly',
    'https://www.googleapis.com/auth/admin.directory.user.readonly',
    'https://www.googleapis.com/auth/plus.login' //to get access token
  ].join(' ');

  public auth2: any; 


  constructor(
     private authService: AuthService,
     private element: ElementRef,
     private router: Router,
     private zone: NgZone
  	) { }


  ngAfterViewInit() {
    console.log("inside afterviewinit");
    this.googleInit();
  }

  onFacebookLoginClick() {
    FB.login;
  }



  public googleInit() {
    console.log("inside google init");
    gapi.load('auth2', () => {
      this.auth2 = gapi.auth2.init({
        client_id: config.clientIdCmaj,
        cookiepolicy: 'single_host_origin',
        scope: this.scope
      });
      this.attachSignin(this.element.nativeElement.firstChild);
    });
  }
  
  public attachSignin(element) {
    console.log("inside attach signin");
    this.auth2.attachClickHandler(element, {},
      (googleUser) => {
        let profile = googleUser.getBasicProfile();
        const accessToken = googleUser.getAuthResponse().access_token;
        this.router.navigate(['/enterkey'], {queryParams: {token: accessToken}});
    }, function (error) {
        console.log(JSON.stringify(error, undefined, 2));
    });
  }
}




