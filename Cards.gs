function onHomepage(e) {

  if (e.parameters && e.parameters.delete && e.parameters.jobId) {
    jobQueueDeleteJob(e.parameters.jobId);
  }

  let cardFooter1Button1Action1 = CardService.newAction()
    .setFunctionName('onHomepage')
    .setParameters({});

  let cardFooter1Button1 = CardService.newTextButton()
    .setText('Refresh')
    .setOnClickAction(cardFooter1Button1Action1);

  let cardFooter1 = CardService.newFixedFooter()
    .setPrimaryButton(cardFooter1Button1);

  let cardSection1TextParagraph3 = CardService.newTextParagraph()
    .setText('Select one or more files to convert.');

  let cardSection1 = CardService.newCardSection()
    .addWidget(cardSection1TextParagraph3)
    .addWidget(CardService.newDivider());

  let jobQueue = jobQueueGet();
  //Only show the "conversions" header if there's something in the Queue (complete or incomplete). 
  if (jobQueue.length > 0) {
    let cardSection1Image1 = CardService.newImage()
      .setImageUrl(QUEUE_HEADER_URL)
      .setAltText('Job Queue');
    cardSection1.addWidget(cardSection1Image1);
  }
  for (let job of jobQueue) {
    let cardSection1DecoratedText1Button1Action1 = CardService.newAction()
      .setFunctionName('onHomepage')
      .setParameters({
        'jobId': job.jobId,
        'delete': 'true'
      });

    let cardSection1DecoratedText1Button1 = CardService.newImageButton()
      .setIconUrl(ICON_TRASH_CAN)
      .setAltText('Remove Job')
      .setOnClickAction(cardSection1DecoratedText1Button1Action1);

    let newTextParagraph = CardService.newDecoratedText()
      .setText(job.srcTitle)
      .setBottomLabel(JOB_STATUS[job.status])
      .setWrapText(true)
      .setButton(cardSection1DecoratedText1Button1);
    cardSection1.addWidget(newTextParagraph);
  }

  let card = CardService.newCardBuilder()
    .setDisplayStyle(CardService.DisplayStyle.REPLACE)
    .addSection(cardGetLogoSection())
    .addSection(cardSection1)
    .setFixedFooter(cardFooter1)
    .build();
  //Logger.log("onHomepage\n" + card.printJson());
  return card;
}
//----------------------------------------------------------//
function onDriveItemsSelected(e) {

  let filesToConvert = [];
  let filesToSkip = [];
  //Logger.log(JSON.stringify(e));
  for (let driveItem of e.drive.selectedItems) {
    if (SUPPORTEDMIMETYPES.includes(driveItem.mimeType)) {
      //I'm doing it this way so I don't have to ge the filesize of every single file. 
      let fileSize = driveGetSize(driveItem.id);
      if (fileSize < DRIVE_MAX_EXPORT_BYTES) {
        filesToConvert.push({ title: driveItem.title, id: driveItem.id });
      }
      else {
        filesToSkip.push({ title: driveItem.title, id: driveItem.id, reason: "Too large" });
      }
    }
    else {
      filesToSkip.push({ title: driveItem.title, id: driveItem.id, reason: "Unsupported Filetype" });
    }
  }
  let cardFooter1Button1Action1 = CardService.newAction()
    .setFunctionName('onFolderPicker')
    .setParameters({});

  let cardFooter1Button1 = CardService.newTextButton()
    .setText('Continue')
    .setDisabled(true)
    .setOnClickAction(cardFooter1Button1Action1);

  if (filesToConvert.length > 0) {
    cardFooter1Button1.setDisabled(false);
  }

  let cardFooter1Button2Action1 = CardService.newAction()
    .setFunctionName('onHomepage')
    .setParameters({});

  let cardFooter1Button2 = CardService.newTextButton()
    .setText('Cancel')
    .setOnClickAction(cardFooter1Button2Action1);

  let cardFooter1 = CardService.newFixedFooter()
    .setPrimaryButton(cardFooter1Button1)
    .setSecondaryButton(cardFooter1Button2);

  let cardSection1 = CardService.newCardSection();

  if (filesToConvert.length > 0) {
    let cardSection1TextParagraph1 = CardService.newTextParagraph()
      .setText('<b>These files will be converted</b>');
    cardSection1.addWidget(cardSection1TextParagraph1);

    for (let i = 0; i < filesToConvert.length; i++) {
      let convertWidget = CardService.newTextParagraph()
        .setText(i + 1 + ". " + filesToConvert[i].title);
      cardSection1.addWidget(convertWidget);
    }
  }

  cardSection1.addWidget(CardService.newDivider());

  if (filesToSkip.length > 0) {
    let cardSection1TextParagraph2 = CardService.newTextParagraph()
      .setText('<b>These files will <u>not</u> be converted</b>');
    cardSection1.addWidget(cardSection1TextParagraph2);

    for (let i = 0; i < filesToSkip.length; i++) {
      let nextCardSection = CardService.newDecoratedText()
        .setText(filesToSkip[i].title)
        .setWrapText(true)
        .setBottomLabel(filesToSkip[i].reason);
      cardSection1.addWidget(nextCardSection);
    }
  }

  let card = CardService.newCardBuilder()
    .setDisplayStyle(CardService.DisplayStyle.REPLACE)
    .setFixedFooter(cardFooter1)
    .addSection(cardGetLogoSection())
    .addSection(cardSection1)
    .build();
  //Logger.log("onDriveItemsSelected\n" + card.printJson());
  return card;
}
//----------------------------------------------------------//
function onFolderPicker(e) {

  preferencesUpdate(e);
  let newJobs = [];
  for (let driveItem of e.drive.selectedItems) {
    if (SUPPORTEDMIMETYPES.includes(driveItem.mimeType)) {
      newJobs.push(jobQueueNewJob(driveItem.title, driveItem.id));
    }
  }
  let newJobsString = JSON.stringify(newJobs);
  let preferences = preferencesGet();

  let teamDrives = driveGetDestinations();

  let folderList = driveGetFoldersInDir(preferences.breadCrumb[preferences.breadCrumb.length - 1].id, preferences.breadCrumb[0].id);

  let cardFooter1Button1Action1 = CardService.newAction()
    .setFunctionName("onConversion")
    .setParameters({ newJob: newJobsString });

  let cardFooter1Button1 = CardService.newTextButton()
    .setText('Convert')
    .setOnClickAction(cardFooter1Button1Action1);

  let cardFooter1Button2Action1 = CardService.newAction()
    .setFunctionName("onHomepage")
    .setParameters({});

  let cardFooter1Button2 = CardService.newTextButton()
    .setText('Cancel')
    .setOnClickAction(cardFooter1Button2Action1);

  let cardFooter1 = CardService.newFixedFooter()
    .setPrimaryButton(cardFooter1Button1)
    .setSecondaryButton(cardFooter1Button2);

  let cardSection1SelectionInput1Action1 = CardService.newAction()
    .setFunctionName("onFolderPicker")
    .setParameters({});

  let cardSection1SelectionInput1 = CardService.newSelectionInput()
    .setFieldName('rootFolderDropdown')
    .setTitle('Destination')
    .setType(CardService.SelectionInputType.DROPDOWN)
    .setOnChangeAction(cardSection1SelectionInput1Action1);

  for (let teamDrive of teamDrives) {
    let isSelected = false;
    if (preferences.breadCrumb[0].id == teamDrive.id) {
      isSelected = true;
    }
    cardSection1SelectionInput1.addItem(teamDrive.title, teamDrive.id, isSelected);
  }

  let cardSection1DecoratedText1 = CardService.newDecoratedText()
    .setTopLabel('Current Folder')
    .setWrapText(true)
    .setText(preferences.currentPath);

  let cardSection1DecoratedText2Icon1 = CardService.newIconImage()
    .setIconUrl(ICON_PARENT_FOLDER_URL);

  let cardSection1DecoratedText2 = CardService.newDecoratedText()
    .setText('<u>Parent Folder</u>')
    .setStartIcon(cardSection1DecoratedText2Icon1);

  if (preferences.breadCrumb.length > 1) {
    let cardSection1DecoratedText2Action1 = CardService.newAction()
      .setFunctionName("onFolderPicker")
      .setParameters({ id: "-1", title: "parent" });
    cardSection1DecoratedText2.setOnClickAction(cardSection1DecoratedText2Action1);
  }

  let cardSection1 = CardService.newCardSection()
    .addWidget(cardSection1SelectionInput1)
    .addWidget(cardSection1DecoratedText1)
    .addWidget(cardSection1DecoratedText2);

  for (let folder of folderList) {
    let cardSection1DecoratedText3Icon1 = CardService.newIconImage()
      .setIconUrl(ICON_FOLDER_URL);

    let cardSection1DecoratedText3Action1 = CardService.newAction()
      .setFunctionName("onFolderPicker")
      .setParameters({ id: folder.id, title: folder.title });

    let cardSection1DecoratedText3 = CardService.newDecoratedText()
      .setText(folder.title)
      .setStartIcon(cardSection1DecoratedText3Icon1)
      .setOnClickAction(cardSection1DecoratedText3Action1);
    cardSection1.addWidget(cardSection1DecoratedText3)
  }

  let card = CardService.newCardBuilder()
    .setDisplayStyle(CardService.DisplayStyle.REPLACE)
    .setFixedFooter(cardFooter1)
    .addSection(cardGetLogoSection())
    .addSection(cardSection1)
    .build();
  //Logger.log("onFolderPicker\n" + card.printJson());
  return card;
}

//----------------------------------------------------------//
function onConversion(e) {
  let preferences = preferencesGet();
  let newJobItems = JSON.parse(e.parameters.newJob);
  let jobQueue = jobQueueGet();

  let destDirId = preferences.breadCrumb[preferences.breadCrumb.length - 1].id;
  let sharedDriveId = preferences.breadCrumb[0].id;
  if (sharedDriveId == "root" || sharedDriveId == "sharedWithMe") {
    sharedDriveId = null;
  }

  for (let i = 0; i < newJobItems.length; i++) {
    newJobItems[i].sharedDriveId = sharedDriveId;
    newJobItems[i].destDir = destDirId;
    newJobItems[i].submitted = Date.now();
    jobQueue.push(newJobItems[i]);
  }

  jobQueueSet(jobQueue);
  jobQueueSetTrigger();
  let cardFooter1Button1Action1 = CardService.newAction()
    .setFunctionName('onHomepage')
    .setParameters({});

  let cardFooter1Button1 = CardService.newTextButton()
    .setText('Home')
    .setOnClickAction(cardFooter1Button1Action1);

  let cardFooter1 = CardService.newFixedFooter()
    .setPrimaryButton(cardFooter1Button1);

  let cardSection1TextParagraph1 = CardService.newTextParagraph()
    .setText('Conversion will start in ' + TRIGGER_DELAY / 1000 + " seconds");

  let cardSection1 = CardService.newCardSection()
    .addWidget(cardSection1TextParagraph1);

  for (let item of newJobItems) {
    let textParagraph = CardService.newDecoratedText()
      .setText(item.srcTitle)
      .setWrapText(true)
      .setBottomLabel('Added to conversion queue');
    cardSection1.addWidget(textParagraph);
  }

  let card = CardService.newCardBuilder()
    .setDisplayStyle(CardService.DisplayStyle.REPLACE)
    .addSection(cardGetLogoSection())
    .addSection(cardSection1)
    .setFixedFooter(cardFooter1)
    .build();
  //Logger.log("onConversion\n" + card.printJson());
  return card;
}
//----------------------------------------------------
function cardGetLogoSection() {
  let cardSection1Image1 = CardService.newImage()
    .setImageUrl(CARD_HEADER_URL)
    .setAltText('Brisk PDF Logo');
  return CardService.newCardSection()
    .addWidget(cardSection1Image1)
}
