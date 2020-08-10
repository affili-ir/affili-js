# affili-js
Affili Javascript Conversion Tracker

## Simple usage
To install the affili-js conversion tracker, copy the following code and paste it immediately after the <head> tag on every page of your site. Replace ACCOUNT_ID with the ID of the your account id.

```Javascript
<script async src="/affili-js-last.js"></script>
<script>
    window.affiliData = window.affiliData || [];
    function affili(){affiliData.push(arguments);}

    affili('create', ACCOUNT_ID);
    affili('detect');
</script> 
```

## Track Single Conversion
To track conversions run the following code in a goal page or call it when the action happend.
For example when a customer buy the product, the following code need to run at the thank you page.
Replace **EXTERNAL_ID** with the invoice number, **AMOUNT** with the amount of conversion, **COMMISSION_KEY** with the key of commission where defined in the panel.


```Javascript
affili('conversion', EXTERNAL_ID, AMOUNT, COMMISSION_KEY);
````

### Notice:
- *AMOUNT* currency is Rial
- *EXTERNAL_ID* must be unique

## Track Multi Conversion
To track multi conversions run the following code in a goal page or call it when the action happend.
For example when a customer buy products where have different categories the following code need to run at the thank you page.
Replace **EXTERNAL_ID** with the invoice number, **AMOUNT** with the amount of conversion, **commissions** with the array of objects of commissions like below example.


```Javascript
let commissions = [
    {
        name: 'sample-1',
        sub_amount: 20000
    },
    {
        name: 'sample-2',
        sub_amount: 40000
    },
];
affili('conversionMulti', EXTERNAL_ID, AMOUNT, commissions);
```


### Notice:
- *AMOUNT* currency is Rial
- *EXTERNAL_ID* must be unique
