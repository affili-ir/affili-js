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

## Track Conversion
To track conversions run the following code in a goal page or call it when the conversion happend.
For example when a customer buy the product, the following code need to run at the thank you page.
Replace EXTERNAL_ID with the invoice number, AMOUNT with the amount of conversion, COMMISSION_KEY with the key of commission where defined in the panel.


```Javascript
affili('conversion', EXTERNAL_ID, AMOUNT, COMMISSION_KEY)
````
