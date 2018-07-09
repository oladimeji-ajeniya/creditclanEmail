import { Component, OnInit, OnDestroy, EventEmitter, ViewContainerRef } from '@angular/core';
import { ViewEncapsulation, Output, Input, AfterViewInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DataService, OptionsserviceService, UserService, CustomerService } from '../_services/index';
import { AuthenticationService, StorageService, LoansService } from '../_services/index';
import { Customer, Loan } from '../_models/index'; 
import { MomentModule } from 'angular2-moment';  
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-loanpeertopeer',
  templateUrl: './loanpeertopeer.component.html',
  styleUrls: ['./loanpeertopeer.component.css']
})
export class LoanpeertopeerComponent implements OnInit {
  lat: number = 51.678418;
  lng: number = 7.809007;
  public calllogsOpen = false;
  public locationOpen = false;
  @Input('parentRouteId') parentRouteId: number;
  @Input('sub_summary') sub_summary = "0";
  @Input('from_loan_contract') from_loan_contract = false;
  public sub: any;
  public currentUser: any;
  public customer: any;
  public loan: any;
  public loading = false;
  public viewingOffer = false;
  public makeOffer = false;
  public toggleDocs = false;
  public changeProduct = false;
  public loan_id: any;
  public editContract = false;
  public offer_area = false;
  public loan_currency = "NGN";
  public loan_duration = "Months";
  public interest_duration = "Per Month";
  public countries: any[];
  PEOPLE_RATING_ID = 0;
  showingMore = false;
  market_status = '0'
  overlayOpen = false;
  public loan_durations = [{ "LOAN_INTEREST_DURATION_ID": 1, "LOAN_DURATION": "Days", "INTEREST_DURATION": "Per Day", "ADJECTIVAL": "Daily", "ABBREV": "d" },
  { "LOAN_INTEREST_DURATION_ID": 2, "LOAN_DURATION": "Months", "INTEREST_DURATION": "Per Month", "ADJECTIVAL": "Monthly", "ABBREV": "Mo" },
  { "LOAN_INTEREST_DURATION_ID": 3, "LOAN_DURATION": "Years", "INTEREST_DURATION": "Per Year", "ADJECTIVAL": "Yearly", "ABBREV": "Yr" },
  { "LOAN_INTEREST_DURATION_ID": 4, "LOAN_DURATION": "Weeks", "INTEREST_DURATION": "Per Week", "ADJECTIVAL": "Weekly", "ABBREV": "Wk" }]
  ;
  public platformOffer: any;
  master: number = 0;
  public model: any; 
  showSuccess(msg) {
    this.toastr.success(msg);
  }
  showError(msg) {
    this.toastr.error(msg);
  }
  constructor(private DataService: DataService, public optionsService: OptionsserviceService, 
    public route: ActivatedRoute, public loansService: LoansService, 
    public customerService: CustomerService, public userService: UserService, 
    public storageService: StorageService, public router: Router,private toastr: ToastrService) {
    //overlay.defaultViewContainer = vcRef;
    this.DataService.onGetLoan.subscribe(res => {
      // console.log(res)
      this.loan = res;
    })
    this.DataService.onViewLoan.subscribe(res => {

      this.overlayOpen = false;
      if (res.from == '2') {
        this.getLoan();
      }
    })

    // On confirmation of removing loan from market
    this.DataService.onConfirmRemoveLoan.subscribe(res => {
      this.removeFromLoanMarket(res['request_id']);
    })






  }

  ngAfterViewInit() {
    //setTimeout(() => this.model = () => this.loancontractformComponent.model, 0);


  }
  save_contract() {

  }
  openOverlay() {
    this.DataService.onGetData.emit(true);
  }
  submitOffer(f) {
    this.loading = true 
    this.loansService.updatePlatformOffer(this.currentUser.token, this.platformOffer)
      .subscribe(loan => { 
        this.loading = false;
        if (loan.status) {
          this.loan = loan.loan;

        } else {


        }
        this.offer_area = false;

      });
  }
  changeCurrency(c) {
    this.loan_currency = c.currency[0];
    this.platformOffer.BID_CURRENCY_ID = c.callingCode[0];
  }
  changeDuration(d, T) {
    if (T === 1) {
      this.loan_duration = d.LOAN_DURATION;
      this.platformOffer.BID_PERIOD_ID = d.LOAN_INTEREST_DURATION_ID;
    }
    if (T === 2) {
      this.interest_duration = d.INTEREST_DURATION;
      this.platformOffer.BID_RATE_PERIOD_ID = d.LOAN_INTEREST_DURATION_ID;
    }

  }
  cancelContract() {
    this.loading = true 
    this.loansService.cancelContract(this.currentUser.token, this.loan.REQUEST_ID)
      .subscribe(loan => { 
        this.loading = false;
        this.loan = loan.loan;
        this.DataService.onGetLoan.emit(loan.loan);
        // swal({
        //   title: "Cancel Request",
        //   text: "Request has been cancelled",
        //   type: "error"
        // });
        this.showError("Request has been cancelled")
      });
  }
  // makeLoanOffer(){
  //   this.offer_area=true;
  //   this.modal.open(NewloancontractComponent, new NewloancontractComponentData(this.loan));
  // }
  ngOnInit() {
    if (this.sub_summary != "0") {
      if (this.sub_summary == "4") {
        this.currentUser = this.storageService.read<any>('currentUser');
        this.loansService.getInvestmentBorrower(this.currentUser.token, this.parentRouteId)
          .subscribe(loan => {
            this.platformOffer = loan.loan.PLATFORM_OFFER; 
            this.loan = loan.loan;
            this.master = loan.loan.REQUEST_ID;
            this.lat = loan.loan.LAT;
            this.lng = loan.loan.LNG;
            this.PEOPLE_RATING_ID = loan.loan.PEOPLE_RATING_ID;

            // If Loan is not in the market, show option to send it.
            if (this.loan['IS_PEER_TO_PEER'] != '1') {
              this.DataService.onOpenLoanChildModal.emit({ 'location': 'confirm_send_to_market', data: { request_id: this.loan['REQUEST_ID'] } });
            }
          });
      } else { 
        this.optionsService.getCountries().subscribe(countries => this.countries = countries);
        this.currentUser = this.storageService.read<any>('currentUser');
        this.loansService.getLoan(this.currentUser.token, this.parentRouteId)
          .subscribe(loan => {
            this.platformOffer = loan.PLATFORM_OFFER; 
            this.loan = loan;
            this.master = loan.REQUEST_ID;
            this.lat = loan.LAT;
            this.lng = loan.LNG;
            this.PEOPLE_RATING_ID = loan.PEOPLE_RATING_ID;

            // If Loan is not in the market, show option to send it.
            if (this.loan['IS_PEER_TO_PEER'] != '1') {
              this.DataService.onOpenLoanChildModal.emit({ 'location': 'confirm_send_to_market', data: { request_id: this.loan['REQUEST_ID'] } });
            }
          });
      }

    } else { 
      this.optionsService.getCountries().subscribe(countries => this.countries = countries);
      this.currentUser = this.storageService.read<any>('currentUser');
      this.getLoan()
    }



  }
  getLoan() {
    this.sub = this.route.parent.params.subscribe(params => {
      this.parentRouteId = +params["id"];
      this.loansService.getLoan(this.currentUser.token, this.parentRouteId)
        .subscribe(loan => {
          this.platformOffer = loan.PLATFORM_OFFER; 
          this.loan = loan;
          this.master = loan.REQUEST_ID;
          this.lat = loan.LAT;
          this.lng = loan.LNG;
          this.PEOPLE_RATING_ID = loan.PEOPLE_RATING_ID;

          // If Loan is not in the market, show option to send it.
          if (this.loan['IS_PEER_TO_PEER'] != '1') {
            this.DataService.onOpenLoanChildModal.emit({ 'location': 'confirm_send_to_market', data: { request_id: this.loan['REQUEST_ID'] } });
          }

        });
    });
  }
  ngOnDestroy() {
    if (this.sub_summary == '0') {
      this.sub.unsubscribe();
    }

  }
  // sendToLoanMarket(loan_id) {
  //   
  //   this.loading = true;
  //   this.loansService.sendToLoanMarket(this.currentUser.token, loan_id)
  //     .subscribe(loan => {
  //       
  //       this.loading = false;

  //       // 
  //       if (loan.status == '1') {
  //         this.loan = loan.loan;
  //         this.DataService.onGetLoan.emit(loan.loan);
  //         swal({
  //           title: "Send to market",
  //           text: "The borrower is yet to accept contract",
  //           type: "error"
  //         });
  //       } else {
  //         this.loan = loan.loan;
  //         this.DataService.onGetLoan.emit(loan.loan);
  //         this.market_status = loan.status;
  //         this.market_status = '0'
  //       }

  //     });
  // }

  confirmRemoveLoan(request_id) {
    this.DataService.onOpenLoanChildModal.emit({ 'location': 'confirm_remove_from_market', data: { request_id: request_id } });
  }

  removeFromLoanMarket(loan_id) { 
    this.loading = true;
    this.loansService.removeFromLoanMarket(this.currentUser.token, loan_id)
      .subscribe(loan => { 
        this.loading = false;
        if (loan.status) {
          this.loan = loan.loan;
          this.router.navigate(['/loan/', loan_id, 'contract']);
          //this.DataService.onGetLoan.emit(loan.loan); 
        } else {
          alert("Loan could not be removed from the market.");
        }
      });
  }
  someMethod(event) {
    console.log(event)
  }
  saveContract() {

  }
  getUserLoags() {

  }
  getUserLocation() {
    this.locationOpen = true;
  }
  getTotalFunded(PERCENTAGE_FUNDED,REQUEST_PRINCIPAL){
    return parseFloat(PERCENTAGE_FUNDED)/100*parseFloat(REQUEST_PRINCIPAL);
  }
  getTotalRemaining(REQUEST_PRINCIPAL,TOTAL_FUNDED){
    return parseFloat(REQUEST_PRINCIPAL)-parseFloat(TOTAL_FUNDED);
  }
}