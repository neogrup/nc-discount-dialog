import { PolymerElement, html } from '@polymer/polymer/polymer-element.js';
import { Debouncer } from '@polymer/polymer/lib/utils/debounce.js';
import { timeOut } from '@polymer/polymer/lib/utils/async.js';
import '@polymer/paper-dialog/paper-dialog.js';
import '@polymer/neon-animation/neon-animation.js';
import '@polymer/paper-button/paper-button.js';
import '@polymer/paper-icon-button/paper-icon-button.js';
import '@polymer/iron-icon/iron-icon.js';
import '@polymer/iron-icons/iron-icons.js';
import '@polymer/iron-icons/communication-icons.js';
import '@polymer/paper-input/paper-input.js';
import '@polymer/iron-a11y-keys/iron-a11y-keys.js';
import '@neogrup/nc-icons/nc-icons.js';
import '@neogrup/nc-keyboard/nc-keyboard.js';
import { dom } from '@polymer/polymer/lib/legacy/polymer.dom.js';
import { mixinBehaviors } from '@polymer/polymer/lib/legacy/class.js';
import { AppLocalizeBehavior } from '@polymer/app-localize-behavior/app-localize-behavior.js';
import {formatNumber} from 'accounting-js';

class NcDiscountDialog extends mixinBehaviors([AppLocalizeBehavior], PolymerElement) {
  static get template() {
    return html`
      <style>
        paper-icon-button {
          width: 60px;
          height: 60px;
        }

        paper-input{
          --paper-input-container-input: {
            font-size: 1.5em;
            text-align: center;
          };
          --paper-input-suffix: {
            font-size: 1.5em;
          };
          
        }

        paper-dialog.modalNoApp > div.header {
          margin-top: 0px;
          @apply --layout-horizontal;
          @apply --layout-center;
        }

        paper-dialog.modalNoApp > div.header > iron-icon {
          margin-right: 12px;
        }

        paper-dialog.modalNoApp > div.content {

        }

        paper-dialog.modalNoApp > div.content > div.content-keyboard{
          margin-top: 20px;
        }

        paper-dialog.modalNoApp > div.content > div.content-percentage {
          @apply --layout-horizontal;
          @apply --layout-center;
          @apply --layout-center-justified;
        }

        paper-dialog.modalNoApp > div.content > div.content-percentage  > div.min {
          @apply --layout-vertical;
          @apply --layout-center;
        }
        
        paper-dialog.modalNoApp > div.content > div.content-percentage  > div.max {
          @apply --layout-vertical;
          @apply --layout-center;
        }

        paper-dialog.modalNoApp > div.content > div.content-percentage > div.percentage{
          width: 120px;
        }

        paper-dialog.modalNoApp > div.content > div.content-amount {
          @apply --layout-horizontal;
          @apply --layout-center;
          @apply --layout-center-justified;
        }

        paper-dialog.modalNoApp > div.content > div.content-amount > div.amount {
          width: 120px;
        }

        paper-button.delete:not([disabled]){
          background-color: var(--error-color);
        }

        paper-button.accept:not([disabled]){
          background-color: var(--success-color);
        }
      </style>
      
      <nc-icons></nc-icons>

      <paper-dialog id="discountDialog" class="modalNoApp" modal dialog>
        <iron-a11y-keys id="a11ySignIn" keys="enter" on-keys-pressed="_accept"></iron-a11y-keys>

        <div class="header">
          <iron-icon icon="nc-icons:discount_2"></iron-icon><h3>[[discountData.name]]</h3>
        </div>
        <div class="content">
          <div class="content-title">
            <div>[[_formatNumber(amountToApplyDiscount)]] [[symbol]]</div>
          </div>
          <div class="content-percentage">
            <div class="min">
              <div>{{localize('DISCOUNT_DIALOG_MIN')}}</div>
              <div>[[discountData.minValue]]%</div>
            </div>
            <paper-icon-button icon="remove-circle" style="color: var(--app-secondary-color);" on-tap="_percentageDec"></paper-icon-button>
            <div class="percentage">
              <paper-input id="percentage" on-focused-changed="_percantageFocusChanged" on-value-changed="_percentageValueChanged" allowed-pattern="[0-9 . ,]" error-message="{{localize('INPUT_ERROR_REQUIRED')}}" value="{{formData.percentage}}" required>
                <div slot="suffix">%</div>
              </paper-input>
            </div>
            <paper-icon-button icon="add-circle" style="color: var(--app-secondary-color);" on-tap="_percentageInc"></paper-icon-button>
            <div class="max">
                <div>{{localize('DISCOUNT_DIALOG_MAX')}}</div>
              <div>[[discountData.maxValue]]%</div>
            </div>
          </div>
          <div class="content-amount">
            <div class="amount">
              <paper-input id="amount" on-focused-changed="_amountFocusChanged" on-value-changed="_amountValueChanged" allowed-pattern="[0-9 . ,]" error-message="{{localize('INPUT_ERROR_REQUIRED')}}" value="{{formData.amount}}">
                <div slot="suffix">[[symbol]]</div>
              </paper-input>
            </div>
          </div>

          <div class="content-keyboard">
            <nc-keyboard
                keyboard-enabled="{{showKeyboard}}"
                keyboard-embedded='S'
                keyboard-type="keyboardNumeric"
                value="{{keyboardValue}}"
                keyboard-current-input="{{keyboardCurrentInput}}">
              </nc-keyboard>
          </div>
        </div>
        <div class="buttons">
          <paper-button class="delete" raised dialog-dismiss>{{localize('BUTTON_CLOSE')}}</paper-button>
          <paper-button class="accept" raised disabled\$="[[loading]]" on-tap="_accept">{{localize('BUTTON_ACCEPT')}}</paper-button>
        </div>
      </paper-dialog>
    `;
  }

  static get properties() {
    return {
      language: {
        type: String
      },
      symbol: String,
      formData: {
        type: Object
      },
      discountData: {
        type: Object,
        value: {}
      }, 
      discountIncreasePercent: Number,
      amountToApplyDiscount: Number,
      showKeyboard: {
        type: String,
      },
      keyboardValue: {
        type: String,
        observer: '_keyboardValueChanged'
      },
      keyboardType: {
        type: String,
        value: 'keyboard'
      },
      keyboardCurrentInput: {
        type: Object
      },
    };
  }

  static get importMeta() { 
    return import.meta; 
  }

  connectedCallback() {
    super.connectedCallback();
    this.useKeyIfMissing = true;
    this.loadResources(this.resolveUrl('./static/translations.json'));
  }

  open(){
    /* Fix Modal paper-dialog appears behind its backdrop */
    var app = document.querySelector('body').firstElementChild.shadowRoot;
    dom(app).appendChild(this.$.discountDialog);
    
    this.formData = {};
    this.keyboardValue = "";
    this.currentInput = "";
    this.keyboardCurrentInput = {};

    this.currentInput = "percentage";

    this.set('formData.percentage', this._formatNumber(this.discountData.percentage));

    this._calcAmount(this.formData.percentage);

    this.$.percentage.invalid = false;
    this.$.amount.invalid = false;

    this.$.discountDialog.open();
    this._setFocusDebouncer = Debouncer.debounce(this._setFocusDebouncer,
      timeOut.after(500),
      () => this._setFocus()
    );
  }

  close(){
    this.$.discountDialog.close();
  }

  _percentageDec(){
    if (Number(this.formData.percentage.replace(',','.')) - Number(this.discountIncreasePercent) >= Number(this.discountData.minValue)){
      this.set('formData.percentage', this._formatNumber(Number(this.formData.percentage.replace(',','.')) - Number(this.discountIncreasePercent)));
      this._calcAmount(this.formData.percentage);
      this._setFocus();
    }
  }

  _percentageInc(){
    if (Number(this.formData.percentage.replace(',','.')) + Number(this.discountIncreasePercent) <= Number(this.discountData.maxValue)){
      this.set('formData.percentage', this._formatNumber(Number(this.formData.percentage.replace(',','.')) + Number(this.discountIncreasePercent)));
      this._calcAmount(this.formData.percentage);
      this._setFocus();
    }
  }

  _percentageValueChanged(e){
    let percentage = e.detail.value;
    this.keyboardValue = e.detail.value;
    percentage = percentage.replace(',','.');
    this.set('formData.percentage', percentage.replace('.',','));
    
    if (this.showKeyboard == "S") {
      this._setFocus();
    }

    this._calcAmount(percentage);
  }

  _amountValueChanged(e){
    let amount = e.detail.value;
    this.keyboardValue = e.detail.value;
    amount = amount.replace(',','.');
    this.set('formData.amount', amount.replace('.',','));

    if (this.showKeyboard == "S") {
      this._setFocus();
    }

    this._calcPercentage(amount);
  }

  _calcAmount(percentage){
    if (!this.formData) return;
    this.set('formData.amount', this._formatNumber((this.amountToApplyDiscount * percentage.replace(',','.')) / 100));
  }

  _calcPercentage(amount){
    if (!this.formData) return;
    this.set('formData.percentage', this._formatNumber((amount.replace(',','.') * 100) / this.amountToApplyDiscount));
  }

  _formatNumber(number) {
    let numberText = "";
    numberText = formatNumber(number, 2, ".", ",")
    return numberText;
  }

  _percantageFocusChanged(e){
    if (e.detail.value === true){
      this.currentInput = e.target.id;
      let input;
      input = this.$.percentage;
      if (input){
        this.keyboardCurrentInput = input;
        this.keyboardValue = input.value;
      }

      this.$.percentage.inputElement.inputElement.select();
    }
  }

  _amountFocusChanged(e){
    if (e.detail.value === true){
      this.currentInput = e.target.id;
      let input;
      input = this.$.amount;
      if (input){
        this.keyboardCurrentInput = input;
        this.keyboardValue = input.value;
      }
      this.$.amount.inputElement.inputElement.select();
    }
  }

  _accept(){
    if (this.$.percentage.validate() && this.$.amount.validate()) {
      if (this._percentageValidate() && this._amountValidate()){
        this.formData.percentage = Number(this.formData.percentage.replace(',','.'))
        this.formData.amount = Number(this.formData.amount.replace(',','.'))
        this.dispatchEvent(new CustomEvent('discount-accepted', {detail: {discount:this.formData, discountData: this.discountData}, bubbles: true, composed: true }));
        this.$.discountDialog.close();
      }
    }
  }

  _percentageValidate(){
    let regexp1 = /^\d+(\.)$/;
    let regexp2 = /^\d+(\.\d{1,2})?$/;

    let isValid = true;
    let percentage = this.$.percentage;
    let percentageValue = String(percentage.value).replace(',','.');


    if (percentageValue != "") {
      if (!regexp1.test(percentageValue) && (!regexp2.test(percentageValue))) {
        isValid = false;
        percentage.errorMessage = this.localize('INPUT_ERROR_NUMBER_INVALID');
      } else{
        if (((parseFloat(percentageValue) < this.discountData.minValue)) || (parseFloat(percentageValue) > this.discountData.maxValue)){
          isValid = false;
          percentage.errorMessage = this.localize('INPUT_ERROR_NUMBER_EXCESS');
        }
      }

    } else{
      percentage.errorMessage = this.localize('INPUT_ERROR_REQUIRED');
      isValid = false;
    }

    if (!isValid){
      percentage.invalid = true;
      percentage.focus();
    }
    return isValid;

  }

  _amountValidate(){
    let regexp1 = /^\d+(\.)$/;
    let regexp2 = /^\d+(\.\d{1,2})?$/;

    let isValid = true;
    let amount = this.$.amount;
    let amountValue = String(amount.value).replace(',','.')


    if (amountValue != "") {
      if (!regexp1.test(amountValue) && (!regexp2.test(amountValue))) {
        isValid = false;
        amount.errorMessage = this.localize('INPUT_ERROR_NUMBER_INVALID');
      }
    }
    else{
      amount.errorMessage = this.localize('INPUT_ERROR_REQUIRED');
      isValid = false;
    }

    if (!isValid){
      amount.invalid = true;
      amount.focus();
    }
    return isValid;

  }

  _keyboardValueChanged(){
    let input;

    if (this.currentInput === "percentage"){
      input = this.$.percentage;
    } else {
      input = this.$.amount;
    }

    if (input){
      this.keyboardCurrentInput = input;
      input.value = this.keyboardValue;
    }
  }
  
  _setFocus(){
    let input;
    if (this.currentInput) {
      if (this.currentInput === "percentage"){
        input = this.$.percentage;
        if (!input.focused){
          this.$.percentage.focus();
          this.$.percentage.inputElement.inputElement.select();
        }
      } else {
        input = this.$.amount;
        if (!input.focused){
          this.$.amount.focus();
          this.$.amount.inputElement.inputElement.select();
        }
      }
    }
  }
}

window.customElements.define('nc-discount-dialog', NcDiscountDialog);
