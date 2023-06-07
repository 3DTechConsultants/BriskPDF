# BriskPDF
_Google Workspace Add-on that allows bulk conversion of native google filetypes to PDF without download. _

**Description**
If you've got a google doc that you want to convert to PDF, how do you do that? You can click File->Download->As PDF, but that downloads the file to your local PC. You can print to PDF but have the same problem. That means you've got potentially sensitive documents hanging around on local filesystems. What if you want to convert 10 google docs to PDF? You've got to do the whole process 10 times. You can install the "save to drive" chrome plugin, but it won't prompt you for the location to save the resulting PDF file. It just gets dumped in the root of your My Drive. 

BriskPDF leverages the built in features of the Drive API to convert as many Google native files as you want (each file can be up to 10MB) and save them directly to whatever folder you want in your My drive, Files shared with you, or shared drives. 

**Setup**
Follow the Google Workspace add-on quickstart to set up your Cloud project: 

https://developers.google.com/apps-script/add-ons/cats-quickstart

Rather than using the files they provide use the files in this project. 
You will also need to enable the Drive API for your Apps Script project. 

