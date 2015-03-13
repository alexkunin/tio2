# Introduction #

Wrapper is a basic concept that could be described using sample code. Look at this plain Titanium snippet:

```
var window = Ti.UI.createWindow({
    backgroundColor:'white'
});

var button = Ti.UI.createButton({
    title:'OK',
    color:'blue',
    left:10,
    top:10,
    width:90,
    height:25
});

button.addEventListener('click', function (e) {
    alert('Clicked!');
});

window.add(button);

window.open();
```

With wrappers you can rewrite the snippet above in a simpler manner:

```
var window = Window({
    backgroundColor:'white',
    items:[
        Button({
            title:'OK',
            color:'blue',
            left:10,
            top:10,
            width:90,
            height:25,
            listeners:{
                click:function (e) {
                    alert('Clicked!');
                }
            }
        })
    ]
});

window.open();
```

What if you want to add another button?

```
var window = Window({
    backgroundColor:'white',
    items:[
        Button({
            title:'OK',
            color:'blue',
            left:10,
            top:10,
            width:90,
            height:25,
            listeners:{
                click:function (e) {
                    alert('Clicked "OK"!');
                }
            }
        }),
        Button({
            title:'Cancel',
            color:'blue',
            left:10,
            top:45,
            width:90,
            height:25,
            listeners:{
                click:function (e) {
                    alert('Clicked "Cancel"!');
                }
            }
        })
    ]
});

window.open();
```

But these two buttons clearly share some visual properties -- color and size. You can easily define your own reusable button which is basically usual Titanium button with some nice defaults:


```
var BlueButton = Button.extend({
    color:'blue',
    width:90,
    height:25
});

var window = Window({
    backgroundColor:'white',
    items:[
        BlueButton({
            title:'OK',
            left:10,
            top:10,
            listeners:{
                click:function (e) {
                    alert('Clicked "OK"!');
                }
            }
        }),
        BlueButton({
            title:'Cancel',
            left:10,
            top:45,
            listeners:{
                click:function (e) {
                    alert('Clicked "Cancel"!');
                }
            }
        })
    ]
});

window.open();
```

You can extend BlueButton too:

```
var WideBlueButton = BlueButton.extend({
    width:120
});
```

All of these basic (Window, Button) and derivative (BlueButton, WideBlueButton) return native Titanium object created via corresponding Ti.UI.createSomething function. All of Ti.UI.createSomething functions have corresponding wrapper -- just remove "Ti.UI.create".