var tokenClient;
var accessToken;

function getClientId() {
  return window.clientId;
}

function getApiKey() {
  return window.Google_apikey;
}
// Function to extract the document ID from the URL
function extractGoogleDocId(url) {
  // URL pattern: https://docs.google.com/document/d/DOCUMENT_ID/edit
  // or https://docs.google.com/document/d/DOCUMENT_ID/
  if (!url) return null;

  try {
    const regex = /\/document\/d\/([-\w]{25,})/;
    const match = url.match(regex);
    return match ? match[1] : null;
  } catch (error) {
    console.error("Error extracting document ID:", error);
    return null;
  }
}

// Initialize the event handler for the form
document.addEventListener("DOMContentLoaded", function () {
  const urlForm = document.getElementById("url-form");
  if (urlForm) {
    urlForm.addEventListener("submit", function (event) {
      event.preventDefault();

      const docUrl = document.getElementById("doc-url").value.trim();
      const docId = extractGoogleDocId(docUrl);

      if (docId) {
        sessionStorage.setItem("fileId", docId);
        showFilePreview(docId);
      } else {
        alert(
          "Invalid Google document URL. Ensure the URL is in the format: https://docs.google.com/document/d/DOCUMENT_ID/edit"
        );
      }
    });
  }
});
async function loadGoogleIdentityServicesScript() {
  await loadScript("https://accounts.google.com/gsi/client");
  console.log("Google Identity Services script loaded.");
}

async function initializeGoogleApis() {
  console.log("Initializing Google APIs...");

  if (sessionStorage.getItem("accessToken")) {
    accessToken = getAccessToken();
    console.log("Access token found in session storage: " + accessToken);
    const isValid = await checkAccessToken(accessToken);
    if (!isValid) {
      console.log("Access token is invalid, requesting a new one...");
      await requestAccessToken();
    }

    await initializeGoogleApiClient(); // Await the initialization of Google API client
  } else if (window.clientId && window.Google_apikey) {
    console.log("Client ID and API key found from server configuration.");
    await requestAccessToken();
    console.log("Setting pick-file button to visible");
    document.getElementById("pick-file").style.display = "block";
    await initializeGoogleApiClient(); // Await the initialization of Google API client
  } else {
    console.error(
      "No API credentials available. Please contact the administrator."
    );
    alert("No API credentials available. Please contact the administrator.");
  }
}

async function loadGoogleApiScript() {
  if (typeof gapi !== "undefined") {
    return;
  }
  await loadScript("https://apis.google.com/js/api.js");
  console.log("Google API script loaded.");
}

function loadScript(src) {
  return new Promise((resolve, reject) => {
    var script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      resolve();
    };
    script.onerror = () => {
      console.error("Failed to load script:", src);
      reject(new Error(`Failed to load script: ${src}`));
    };
    document.body.appendChild(script);
  });
}

async function requestAccessToken() {
  console.log("Requesting access token...");

  // Return a Promise that will be resolved when we get the token
  return new Promise((resolve, reject) => {
    try {
      if (!tokenClient) {
        // Create the tokenClient only once
        const client = google.accounts.oauth2.initTokenClient({
          client_id: getClientId(),
          scope: [
            "https://www.googleapis.com/auth/drive.metadata.readonly",
            "https://www.googleapis.com/auth/documents",
            "https://www.googleapis.com/auth/documents.readonly",
            "https://www.googleapis.com/auth/drive",
            "https://www.googleapis.com/auth/drive.readonly",
            "https://www.googleapis.com/auth/drive.file",
            "https://www.googleapis.com/auth/drive.resource",
          ].join(" "),
          callback: function (response) {
            if (response.error) {
              console.error("Error during token request:", response.error);
              // Reject the Promise
              reject(response.error);
              return;
            }
            console.log("Access token acquired:", response.access_token);
            accessToken = response.access_token;
            sessionStorage.setItem("accessToken", accessToken);
            resolve(accessToken);
          },
        });

        // Store the tokenClient instance
        tokenClient = client;

        // Request the token
        client.requestAccessToken();
      } else {
        // If tokenClient already exists, update its callback and request the token
        tokenClient.callback = function (response) {
          if (response.error) {
            console.error("Error during token request:", response.error);
            reject(response.error);
            return;
          }
          console.log(
            "Access token acquired (existing client):",
            response.access_token
          );
          accessToken = response.access_token;
          sessionStorage.setItem("accessToken", accessToken);
          gapi.client.setToken({ access_token: accessToken });
          console.log("Resolving the access token promise (existing client)");
          resolve(accessToken);
        };

        // Request token using existing client
        tokenClient.requestAccessToken();
      }
    } catch (error) {
      console.error("Error initializing token client:", error);
      reject(error);
    }
  });
}
async function checkAccessToken(accessToken) {
  console.log("Checking token:", accessToken);
  try {
    const response = await fetch(
      `https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${accessToken}`
    );
    const data = await response.json();

    if (!response.ok) {
      console.log("Response not OK:", response.status, response.statusText);
    }

    // Check if the token is expired or invalid
    if (data.error || data.expires_in <= 0) {
      console.log("Token is invalid or expired:", data.error || "Expired");
      return false;
    }

    // Add message when token is valid
    console.log("Token is valid, expires in:", data.expires_in, "seconds");
    return true;
  } catch (error) {
    return false;
  }
}

async function initializeGoogleApiClient() {
  console.log("Initializing Google API client...");
  await loadGoogleApiScript();
  return await new Promise((resolve) => {
    gapi.load("client", () => {
      console.log("Google API client loaded.");
      gapi.client
        .load("drive", "v3")
        .then(() => {
          console.log("Google Drive API loaded.");
          return gapi.client.load("docs", "v1");
        })
        .then(() => {
          console.log("Google Docs API loaded.");
          resolve();
        });
    });
  });
}

function getAccessToken() {
  return sessionStorage.getItem("accessToken");
}

function loadPicker() {
  // Check if we already have a token
  accessToken = getAccessToken();

  if (!accessToken) {
    console.log("No access token available, requesting one first");
    requestAccessToken().then(() => {
      // Only after we have a token, load the picker
      loadPickerAPI();
    });
  } else {
    // We already have a token, just load the picker
    loadPickerAPI();
  }
}

async function loadPickerAPI() {
  console.log("Loading picker API");
  // Check if the access token is valid
  accessToken = getAccessToken();
  const isValid = await checkAccessToken(accessToken);
  if (!isValid) {
    console.log("Access token is invalid, requesting a new one...");
    await requestAccessToken();
  }

  // Make sure gapi is loaded before trying to use it
  if (typeof gapi === "undefined") {
    console.log("gapi is not defined, loading Google API script first");
    await loadGoogleApiScript();
  }

  // Initialize Google API client if not already done
  if (typeof gapi.client === "undefined") {
    console.log(
      "gapi.client is not initialized, initializing Google API client"
    );
    await initializeGoogleApiClient();
  }

  // Set the access token in gapi client
  if (typeof gapi.client !== "undefined") {
    try {
      gapi.client.setToken({ access_token: accessToken });
      console.log("Token successfully set in gapi client");
    } catch (err) {
      console.warn("Could not set token in gapi client:", err);
    }
  }

  // Now we can safely call gapi.load
  gapi.load("picker", { callback: onPickerApiLoad });
}
function onPickerApiLoad() {
  console.log("Picker loading.");
  // List view
  const docsView = new google.picker.DocsView(google.picker.ViewId.DOCUMENTS);

  const picker = new google.picker.PickerBuilder()
    .setAppId(getApiKey())
    .setDeveloperKey(getApiKey())
    .setOAuthToken(accessToken)
    .addView(docsView)
    .setCallback(pickerCallback)
    .build();
  picker.setVisible(true);
}

function pickerCallback(data) {
  if (data.action == google.picker.Action.PICKED) {
    var fileId = data.docs[0].id;
    console.log("File ID: " + fileId);
    sessionStorage.setItem("fileId", fileId);

    // Fill the URL field with the full URL of the selected document
    const docUrl = `https://docs.google.com/document/d/${fileId}/edit`;
    document.getElementById("doc-url").value = docUrl;

    showFilePreview(fileId);
  }
}

async function showFilePreview(fileId) {
  console.log("Fetching file preview for file ID: " + fileId);
  // in case gapi.client is not defined

  if (typeof gapi.client === "undefined") {
    console.log("gapi.client is not defined. ");
    await initializeGoogleApiClient();
  }

  gapi.client.setApiKey(getApiKey());
  gapi.client.setToken({ access_token: accessToken });

  try {
    const response = await gapi.client.drive.files.get({
      fileId: fileId,
      fields: "webViewLink, name",
    });
    var obj_file = response.result;
    var previewUrl = obj_file.webViewLink;
    var fileName = obj_file.name;

    console.log("fileName:", fileName);

    // display a view of the selected file
    var iframe = document.getElementById("file-preview");
    iframe.src = previewUrl;
    iframe.style.display = "block";

    document.getElementById("link-container").style.display = "block";
    document.getElementById("file-link").innerHTML = fileName;
    document.getElementById("file-link").href = previewUrl;
    document.getElementById("parse-file").style.display = "block";
  } catch (error) {
    console.error("Error getting file preview link: ", error);
    console.error("Error details:", error.result.error);
  }
}

async function parseGoogleDoc(fileId) {
  if (!fileId) {
    console.error("No file selected.");
    return Promise.resolve([]);
  }

  // Ensure the Google Docs API is loaded
  if (!gapi.client.docs) {
    console.error("Google Docs API not loaded.");
    return Promise.resolve([]);
  }

  // Check if the access token is valid
  accessToken = getAccessToken();
  const isValid = await checkAccessToken(accessToken);
  if (!isValid) {
    console.log("Access token is invalid, requesting a new one...");
    await requestAccessToken();
  }

  // Set the access token
  gapi.auth.setToken({ access_token: accessToken });

  try {
    const response = await gapi.client.docs.documents.get({
      documentId: fileId,
      includeTabsContent: true,
    });

    const docData = response.result;
    const tabs = docData.tabs || [];
    const docTitle = docData.title || "Document";

    // Create an object to store all lists from all tabs
    let allLists = {};

    // Add lists from the main document
    if (docData.lists) {
      allLists = { ...allLists, ...docData.lists };
    }

    // Add lists from each tab
    if (tabs && tabs.length > 0) {
      for (const tab of tabs) {
        if (tab.documentTab && tab.documentTab.lists) {
          allLists = { ...allLists, ...tab.documentTab.lists };
        }
        // Recursive function to get lists from child tabs
        const getListsFromChildTabs = (childTabs) => {
          if (!childTabs) return;

          for (const childTab of childTabs) {
            if (childTab.documentTab && childTab.documentTab.lists) {
              allLists = { ...allLists, ...childTab.documentTab.lists };
            }

            if (childTab.childTabs && childTab.childTabs.length > 0) {
              getListsFromChildTabs(childTab.childTabs);
            }
          }
        };

        // Get lists from child tabs
        if (tab.childTabs && tab.childTabs.length > 0) {
          getListsFromChildTabs(tab.childTabs);
        }
      }
    }

    // Use all collected lists instead of just docData.lists
    const docLists = allLists;

    // Function to process content with the lists object
    const processTabContentWithLists = (content, lists) => {
      if (!content) return "";
      return parseTabContent(content, lists);
    };

    // Generate a sanitized folder name for the document
    const sanitizedTitle = docTitle
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "") // Remove all special characters
      .replace(/\s+/g, "-") // Replace spaces with hyphens
      .replace(/-+/g, "-") // Avoid multiple hyphens
      .trim();

    // Use the document title as the folder name
    const folderName = sanitizedTitle;

    // Get the list of existing images
    const existingImages = await getExistingImages(folderName);
    console.log("Existing images found:", Object.keys(existingImages).length);

    // Extract all inline object IDs (images)
    const inlineObjectIds = [];
    const processContent = (content) => {
      if (!content) return;

      for (const element of content) {
        if (element.paragraph) {
          for (const paraElement of element.paragraph.elements) {
            // Detect standard inline objects (images and links)
            if (
              paraElement.inlineObjectElement &&
              paraElement.inlineObjectElement.inlineObjectId
            ) {
              inlineObjectIds.push(
                paraElement.inlineObjectElement.inlineObjectId
              );
            }

            // Detect richLinks (Google Drive links as bullets)
            else if (paraElement.richLink) {
              if (paraElement.richLink.richLinkId) {
                inlineObjectIds.push(paraElement.richLink.richLinkId);
              }
            }
            // Other existing detections...
            else if (paraElement.embeddedObject) {
              if (paraElement.embeddedObject.embeddedObjectId) {
                inlineObjectIds.push(
                  paraElement.embeddedObject.embeddedObjectId
                );
              }
            } else if (paraElement.linkedContentReference) {
              if (paraElement.linkedContentReference.linkedObjectId) {
                inlineObjectIds.push(
                  paraElement.linkedContentReference.linkedObjectId
                );
              }
            }
          }
        } else if (element.table) {
          for (const row of element.table.tableRows || []) {
            for (const cell of row.tableCells || []) {
              processContent(cell.content);
            }
          }
        } else if (element.list) {
          for (const item of element.list.listItems || []) {
            if (item.content) {
              processContent(item.content);
            }
          }
        }

        // Check if the element itself is an inline object or a Drive link
        if (
          element.inlineObjectElement &&
          element.inlineObjectElement.inlineObjectId
        ) {
          inlineObjectIds.push(element.inlineObjectElement.inlineObjectId);
        }
        if (element.embeddedObject && element.embeddedObject.embeddedObjectId) {
          inlineObjectIds.push(element.embeddedObject.embeddedObjectId);
        }
      }
    };

    // Process the main document content to find inline objects
    processContent(docData.body?.content);

    // Process the tabs to find inline objects
    for (const tab of tabs) {
      if (tab.documentTab?.body?.content) {
        processContent(tab.documentTab.body.content);
      }

      // Recursively process child tabs
      const processChildTabs = (childTabs) => {
        if (!childTabs) return;

        for (const childTab of childTabs) {
          if (childTab.documentTab?.body?.content) {
            processContent(childTab.documentTab.body.content);
          }

          if (childTab.childTabs) {
            processChildTabs(childTab.childTabs);
          }
        }
      };

      processChildTabs(tab.childTabs);
    }

    // Get inline objects data
    const inlineObjectsData = await getInlineObjectsData(
      fileId,
      inlineObjectIds
    );

    // Convert image URIs to base64 only if necessary
    const imagePromises = [];
    for (const id in inlineObjectsData) {
      if (inlineObjectsData[id].type === "image" && inlineObjectsData[id].uri) {
        // Check if the image already exists
        if (existingImages[id]) {
          // Add local file information instead of base64
          const extension = existingImages[id].extension;
          inlineObjectsData[id].localFilePath = `images/${id}.${extension}`;
          inlineObjectsData[id].skipProcessing = true; // Mark to avoid further processing
        } else {
          // The image does not exist, convert it to base64
          imagePromises.push(
            convertImageToBase64(inlineObjectsData[id].uri).then((base64) => {
              if (base64) {
                inlineObjectsData[id].base64 = base64;
              }
            })
          );
        }
      }
    }

    // Wait for all images to be converted
    await Promise.all(imagePromises);

    // Structure to store tab data
    let tabsData = [];

    // Get the structure and content of the tabs
    // Fill the tabsData structure with the main tabs
    if (tabs && tabs.length > 0) {
      for (const tab of tabs) {
        const tabInfo = {
          id:
            tab.tabId ||
            `tab-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          title: tab.tabProperties.title || "Untitled",
          content: "",
          childTabs: [],
        };

        // Get the content of the tab
        if (
          tab.documentTab &&
          tab.documentTab.body &&
          tab.documentTab.body.content
        ) {
          // Use processTabContentWithLists to pass docLists to parseTabContent
          tabInfo.content = processTabContentWithLists(
            tab.documentTab.body.content,
            docLists
          );
        }

        // Get child tabs recursively
        if (tab.childTabs && tab.childTabs.length > 0) {
          getChildTabsWithLists(tab.childTabs, tabInfo.childTabs, docLists);
        }

        tabsData.push(tabInfo);
      }
    } else {
      // If no tabs, create a main tab with the document content
      const mainTabInfo = {
        id: `main-tab-${Date.now()}`,
        title: docTitle,
        content: processTabContentWithLists(docData.body.content, docLists),
        childTabs: [],
      };
      tabsData.push(mainTabInfo);
    }

    // Process image paths in tab content
    tabsData = processTabsContent(tabsData, inlineObjectsData, folderName);

    // Generate the site HTML
    const siteHtml = generateSiteHtml(docTitle, tabsData, inlineObjectsData);

    // Display or download the result
    displayGeneratedSite(siteHtml, inlineObjectsData, docTitle);

    return tabsData;
  } catch (error) {
    console.error("Error generating site from document:", error);
    return Promise.reject(error);
  }
}
// Recursive function to get all child tabs
function getChildTabsWithLists(childTabs, targetArray, docLists) {
  for (const childTab of childTabs) {
    const tabInfo = {
      id:
        childTab.id ||
        `tab-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: childTab.tabProperties.title || "Untitled",
      content: "",
      childTabs: [],
    };

    // Get the content of the child tab - if it has a documentTab
    if (
      childTab.documentTab &&
      childTab.documentTab.body &&
      childTab.documentTab.body.content
    ) {
      // Merge the tab's lists with the already collected lists
      if (childTab.documentTab.lists) {
        docLists = { ...docLists, ...childTab.documentTab.lists };
      }
      tabInfo.content = parseTabContent(
        childTab.documentTab.body.content,
        docLists
      );
    }

    // Recursively get child tabs
    if (childTab.childTabs && childTab.childTabs.length > 0) {
      getChildTabsWithLists(childTab.childTabs, tabInfo.childTabs, docLists);
    }

    targetArray.push(tabInfo);
  }
}

function parseTabContent(content, docLists) {
  let htmlContent = "";
  let currentListId = null;
  let currentNestingLevel = -1;
  let openLists = []; // Stack to track open lists with their types

  // Function that determines the list type and CSS class to use
  function getListTypeAndClass(bullet, nestingLevel, paragraphHtml) {
    let isOrdered = false;
    let cssClass = "";

    // Get the listId to access the list properties in docLists
    const listId = bullet.listId;

    // Check if we have info on this list in docLists
    if (docLists && docLists[listId]) {
      const listProperties = docLists[listId].listProperties;

      if (
        listProperties &&
        listProperties.nestingLevels &&
        listProperties.nestingLevels[nestingLevel]
      ) {
        const nestingLevelProps = listProperties.nestingLevels[nestingLevel];

        if (nestingLevelProps.glyphType) {
          const orderedTypes = [
            "GLYPH_TYPE_UNSPECIFIED",
            "DECIMAL",
            "ZERO_DECIMAL",
            "UPPER_ALPHA",
            "ALPHA",
            "UPPER_ROMAN",
            "ROMAN",
          ];
          isOrdered = orderedTypes.includes(nestingLevelProps.glyphType);

          // Determine the CSS class
          if (nestingLevelProps.glyphType === "UPPER_ALPHA")
            cssClass = "upper-alpha";
          else if (nestingLevelProps.glyphType === "ALPHA")
            cssClass = "lower-alpha";
          else if (nestingLevelProps.glyphType === "UPPER_ROMAN")
            cssClass = "upper-roman";
          else if (nestingLevelProps.glyphType === "ROMAN")
            cssClass = "lower-roman";

          return {
            tag: isOrdered ? "ol" : "ul",
            class: cssClass,
          };
        }
      }
    }

    return {
      tag: isOrdered ? "ol" : "ul",
      class: cssClass,
    };
  }

  // Iterate through all content elements
  for (const element of content) {
    if (element.tableOfContents) {
      // Handle tableOfContents elements

      // Close open lists before inserting a table of contents
      while (openLists.length > 0) {
        const lastList = openLists.pop();
        if (openLists.length === 0) {
          htmlContent += `</li></${lastList.tag}>`;
        } else {
          htmlContent += `</${lastList.tag}></li>`;
        }
      }
      currentListId = null;
      currentNestingLevel = -1;

      // Generate the HTML placeholder for the table of contents
      htmlContent += `<div class="table-of-contents">
        <h3>Table of Contents</h3>
        <div class="toc-placeholder" data-auto-generated="true"></div>
      </div>`;

      // Do not process the content of the tableOfContents element to avoid duplication
    } else if (element.paragraph) {
      const paragraph = element.paragraph;
      let paragraphHtml = "";

      // Process paragraph elements
      for (const paraElement of paragraph.elements || []) {
        if (paraElement.textRun) {
          const text = paraElement.textRun.content;
          // Clean the text of control characters
          const cleanedText = cleanControlCharacters(text);
          const textStyle = paraElement.textRun.textStyle || {};
          let formattedText = cleanedText;

          if (textStyle.link && textStyle.link.url) {
            formattedText = `<a href="${textStyle.link.url}" target="_blank" rel="noopener noreferrer">${formattedText}</a>`;
          } else {
            if (textStyle.bold)
              formattedText = `<strong>${formattedText}</strong>`;
            if (textStyle.italic) formattedText = `<em>${formattedText}</em>`;
            if (textStyle.underline) formattedText = `<u>${formattedText}</u>`;
          }

          paragraphHtml += formattedText;
        } else if (paraElement.inlineObjectElement) {
          const objectId = paraElement.inlineObjectElement.inlineObjectId;
          if (objectId) {
            paragraphHtml += `<span id="${objectId}" class="inline-object" data-object-id="${objectId}">[Object loading...]</span>`;
          } else {
            paragraphHtml += "[Embedded object]";
          }
        } else if (paraElement.richLink) {
          const richLinkId = paraElement.richLink.richLinkId;
          if (richLinkId) {
            paragraphHtml += `<span id="${richLinkId}" class="inline-object rich-link" data-object-id="${richLinkId}">[Google Drive link loading...]</span>`;
          } else {
            paragraphHtml += "[Google Drive link]";
          }
        }
      }

      // detect the type of list item and CSS class
      if (paragraph.bullet) {
        const listId = paragraph.bullet.listId;
        const nestingLevel = paragraph.bullet.nestingLevel || 0;

        // Determine the list type and class for this specific level
        const listInfo = getListTypeAndClass(
          paragraph.bullet,
          nestingLevel,
          paragraphHtml
        );

        const listTag = listInfo.tag;
        const listClass = listInfo.class ? ` class="${listInfo.class}"` : "";

        // Handle list changes and nesting levels
        if (currentListId !== listId) {
          // Close all open lists if it's a new list
          while (openLists.length > 0) {
            const lastList = openLists.pop();
            htmlContent += `</${lastList.tag}>`;
          }

          // Start a new list
          htmlContent += `<${listTag}${listClass}>`;

          openLists.push({
            id: listId,
            tag: listTag,
            level: nestingLevel,
            class: listInfo.class,
          });

          currentListId = listId;
          currentNestingLevel = nestingLevel;
        }
        // Same list but different level
        else if (currentNestingLevel !== nestingLevel) {
          if (nestingLevel > currentNestingLevel) {
            // Before opening a nested list, ensure we have closed the current <li>
            // or add a <li> if necessary, then open the new list
            for (let i = currentNestingLevel + 1; i <= nestingLevel; i++) {
              // For each level, determine its own list type
              // Use the specific level information in docLists
              let levelInfo;
              if (
                docLists &&
                docLists[listId] &&
                docLists[listId].listProperties &&
                docLists[listId].listProperties.nestingLevels &&
                docLists[listId].listProperties.nestingLevels[i]
              ) {
                const levelProps =
                  docLists[listId].listProperties.nestingLevels[i];
                const orderedTypes = [
                  "GLYPH_TYPE_UNSPECIFIED",
                  "DECIMAL",
                  "ZERO_DECIMAL",
                  "UPPER_ALPHA",
                  "ALPHA",
                  "UPPER_ROMAN",
                  "ROMAN",
                ];
                const isLevelOrdered =
                  levelProps.glyphType &&
                  orderedTypes.includes(levelProps.glyphType);

                let levelClass = "";
                if (levelProps.glyphType === "UPPER_ALPHA")
                  levelClass = "upper-alpha";
                else if (levelProps.glyphType === "ALPHA")
                  levelClass = "lower-alpha";
                else if (levelProps.glyphType === "UPPER_ROMAN")
                  levelClass = "upper-roman";
                else if (levelProps.glyphType === "ROMAN")
                  levelClass = "lower-roman";

                levelInfo = {
                  tag: isLevelOrdered ? "ol" : "ul",
                  class: levelClass,
                };
              } else {
                // Fallback if specific information is not available
                levelInfo = getListTypeAndClass(paragraph.bullet, i, "");
              }

              const levelTag = levelInfo.tag;
              const levelClass = levelInfo.class
                ? ` class="${levelInfo.class}"`
                : "";

              // Simply open the new list
              htmlContent += `<${levelTag}${levelClass}>`;

              openLists.push({
                id: listId,
                tag: levelTag,
                level: i,
                class: levelInfo.class,
                needsClosingLi: false, // Indicate that there is no <li> to close
              });
            }
          } else {
            // Close excess nested levels
            const levelDiff = currentNestingLevel - nestingLevel;
            for (let i = 0; i < levelDiff; i++) {
              if (openLists.length > 1) {
                const lastList = openLists.pop();
                // Close only the list tag without </li>
                htmlContent += `</${lastList.tag}>`;
              }
            }
          }
          currentNestingLevel = nestingLevel;
        }

        // Add the list item
        htmlContent += `<li>${paragraphHtml}`;
      } else {
        // Close all open lists at the end
        while (openLists.length > 0) {
          const lastList = openLists.pop();
          if (openLists.length === 0) {
            // Close the last <li> then the list
            htmlContent += `</li></${lastList.tag}>`;
          } else {
            // For nested lists, close only the list
            htmlContent += `</${lastList.tag}>`;
          }
        }
        currentListId = null;
        currentNestingLevel = -1;

        // Normal paragraph processing
        const style =
          paragraph.paragraphStyle && paragraph.paragraphStyle.namedStyleType
            ? paragraph.paragraphStyle.namedStyleType
            : "NORMAL_TEXT";

        if (style.includes("HEADING")) {
          const headingLevel = style.charAt(style.length - 1);
          // Create an ID based on the heading text for anchors
          let headingId = paragraphHtml
            .replace(/<[^>]+>/g, "") // Remove HTML tags
            .trim()
            .toLowerCase()
            .replace(/[^\w\s-]/g, "") // Remove special characters
            .replace(/\s+/g, "-") // Replace spaces with hyphens
            .replace(/--+/g, "-"); // Avoid multiple hyphens

          // Add a unique numeric suffix if necessary
          headingId = `heading-${headingId}-${Date.now()
            .toString()
            .substr(-6)}`;

          // Generate the heading HTML with the ID attribute
          htmlContent += `<h${headingLevel} id="${headingId}">${paragraphHtml}</h${headingLevel}>`;
        } else {
          htmlContent += `<p>${paragraphHtml}</p>`;
        }
      }
    } else if (element.table) {
      // Close open lists before inserting a table
      while (openLists.length > 0) {
        const lastList = openLists.pop();
        if (openLists.length === 0) {
          htmlContent += `</li></${lastList.tag}>`;
        } else {
          htmlContent += `</${lastList.tag}></li>`;
        }
      }
      currentListId = null;
      currentNestingLevel = -1;
      htmlContent += parseTableContent(element.table);
    } else if (element.sectionBreak) {
      // Close open lists before inserting a section break
      while (openLists.length > 0) {
        const lastList = openLists.pop();
        if (openLists.length === 0) {
          htmlContent += `</li></${lastList.tag}>`;
        } else {
          htmlContent += `</${lastList.tag}></li>`;
        }
      }
      currentListId = null;
      currentNestingLevel = -1;
    }
  }

  // Close all open lists at the end
  while (openLists.length > 0) {
    const lastList = openLists.pop();
    if (openLists.length === 0) {
      // For the outermost list, close the last <li> then the list
      htmlContent += `</li></${lastList.tag}>`;
    } else {
      // For nested lists, close only the list
      htmlContent += `</${lastList.tag}>`;
    }
  }

  return htmlContent;
}
// Function to process table content
function parseTableContent(table) {
  if (!table || !table.tableRows) {
    return "";
  }

  let tableHtml =
    "<table border='1' cellpadding='5' cellspacing='0' style='border-collapse: collapse;'>";

  // Process each table row
  for (const row of table.tableRows) {
    tableHtml += "<tr>";

    // Process each cell in the row
    if (row.tableCells) {
      for (const cell of row.tableCells) {
        // Determine if it's a header (first row)
        const isHeader = table.tableRows.indexOf(row) === 0;
        const cellTag = isHeader ? "th" : "td";

        // Get cell style properties
        let style = "";
        if (cell.tableCellStyle) {
          // Apply cell padding if defined
          if (cell.tableCellStyle.backgroundColor) {
            const bg = cell.tableCellStyle.backgroundColor;
            // Convert RGB color to hexadecimal if necessary
            if (bg.color && bg.color.rgbColor) {
              const r = Math.round((bg.color.rgbColor.red || 0) * 255);
              const g = Math.round((bg.color.rgbColor.green || 0) * 255);
              const b = Math.round((bg.color.rgbColor.blue || 0) * 255);
              style += `background-color: rgb(${r}, ${g}, ${b}); `;
            }
          }

          // Handle cell merging
          if (
            cell.tableCellStyle.columnSpan &&
            cell.tableCellStyle.columnSpan > 1
          ) {
            tableHtml += `<${cellTag} colspan="${cell.tableCellStyle.columnSpan}" style="${style}">`;
          } else if (
            cell.tableCellStyle.rowSpan &&
            cell.tableCellStyle.rowSpan > 1
          ) {
            tableHtml += `<${cellTag} rowspan="${cell.tableCellStyle.rowSpan}" style="${style}">`;
          } else {
            tableHtml += `<${cellTag} style="${style}">`;
          }
        } else {
          tableHtml += `<${cellTag}>`;
        }

        // Process cell content
        if (cell.content) {
          let cellContent = "";
          for (const element of cell.content) {
            if (element.paragraph) {
              // Process paragraph in the cell
              const paragraph = element.paragraph;
              let paragraphHtml = "";

              if (paragraph.elements) {
                // Convert paragraph elements to HTML
                for (const paraElement of paragraph.elements) {
                  if (paraElement.textRun) {
                    const text = paraElement.textRun.content;
                    // Clean the text of control characters
                    const cleanedText = cleanControlCharacters(text);
                    const textStyle = paraElement.textRun.textStyle || {};
                    let formattedText = cleanedText;

                    if (textStyle.link && textStyle.link.url) {
                      // Determine if it's an internal link (link to a document heading)
                      if (textStyle.link.url.startsWith("#")) {
                        // It's an internal link, adapt the anchor format to match our convention
                        const targetText = textStyle.link.url.substring(1); // Remove the initial #

                        // Create an ID in the same format used for headings
                        const targetId = `heading-${targetText
                          .toLowerCase()
                          .replace(/[^\w\s-]/g, "")
                          .replace(/\s+/g, "-")
                          .replace(/--+/g, "-")}-`;

                        // Use a data-target attribute to associate later via JavaScript
                        formattedText = `<a href="javascript:void(0)" class="toc-link" data-target="${targetId}">${formattedText}</a>`;
                      } else {
                        // Normal external link
                        formattedText = `<a href="${textStyle.link.url}" target="_blank" rel="noopener noreferrer">${formattedText}</a>`;
                      }
                    } else {
                      // Apply text styles
                      if (textStyle.bold) {
                        formattedText = `<strong>${formattedText}</strong>`;
                      }
                      if (textStyle.italic) {
                        formattedText = `<em>${formattedText}</em>`;
                      }
                      if (textStyle.underline) {
                        formattedText = `<u>${formattedText}</u>`;
                      }
                    }
                    paragraphHtml += formattedText;
                  } else if (paraElement.inlineObjectElement) {
                    // Handle inline objects in tables
                    const objectId =
                      paraElement.inlineObjectElement.inlineObjectId;
                    if (objectId) {
                      paragraphHtml += `<span id="${objectId}" class="inline-object" data-object-id="${objectId}">[Object loading...]</span>`;
                    }
                  }
                }
              }

              cellContent += paragraphHtml;
            } else if (element.table) {
              // Handle nested tables
              cellContent += parseTableContent(element.table);
            }
          }
          tableHtml += cellContent;
        }

        tableHtml += `</${cellTag}>`;
      }
    }

    tableHtml += "</tr>";
  }

  tableHtml += "</table>";
  return tableHtml;
}

async function getInlineObjectsData(fileId, inlineObjectIds) {
  if (!inlineObjectIds || inlineObjectIds.length === 0) {
    return {};
  }

  try {
    // Request the document with includeTabsContent: true to get all objects
    const response = await gapi.client.docs.documents.get({
      documentId: fileId,
      includeTabsContent: true,
    });

    const docData = response.result;

    // Collect all inlineObjects from the main document and tabs
    const allInlineObjects = {};
    // Instead of a separate collection, we will store richLinks by ID in an object
    const allRichLinks = {};

    // Add inlineObjects from the main document
    if (docData.inlineObjects) {
      Object.assign(allInlineObjects, docData.inlineObjects);
    }

    // Function to extract richLinks from content
    const extractRichLinks = (content) => {
      if (!content) return;

      for (const element of content) {
        if (element.paragraph && element.paragraph.elements) {
          for (const paraElement of element.paragraph.elements) {
            if (paraElement.richLink && paraElement.richLink.richLinkId) {
              // Store the richLink by its ID
              allRichLinks[paraElement.richLink.richLinkId] =
                paraElement.richLink;
            }
          }
        }

        // Recursively process tables
        if (element.table && element.table.tableRows) {
          for (const row of element.table.tableRows) {
            if (row.tableCells) {
              for (const cell of row.tableCells) {
                if (cell.content) {
                  extractRichLinks(cell.content);
                }
              }
            }
          }
        }
      }
    };

    // Extract richLinks from the main document
    if (docData.body && docData.body.content) {
      extractRichLinks(docData.body.content);
    }

    // Recursive function to extract inlineObjects and richLinks from tabs
    const extractObjectsFromTabs = (tabs) => {
      if (!tabs) return;

      for (const tab of tabs) {
        // Extract inlineObjects from each tab
        if (tab.documentTab && tab.documentTab.inlineObjects) {
          Object.assign(allInlineObjects, tab.documentTab.inlineObjects);
        }

        // Extract richLinks from the content of each tab
        if (
          tab.documentTab &&
          tab.documentTab.body &&
          tab.documentTab.body.content
        ) {
          extractRichLinks(tab.documentTab.body.content);
        }

        // Recursively explore child tabs
        if (tab.childTabs && tab.childTabs.length > 0) {
          extractObjectsFromTabs(tab.childTabs);
        }
      }
    };

    // Process tabs if they exist
    if (docData.tabs && docData.tabs.length > 0) {
      extractObjectsFromTabs(docData.tabs);
    }

    const objectsData = {};

    for (const id of inlineObjectIds) {
      // Check if it's a standard inline object (image)
      if (allInlineObjects[id]) {
        const inlineObject = allInlineObjects[id];
        const embeddedObject =
          inlineObject.inlineObjectProperties?.embeddedObject;

        // Check if it's an image
        let embedId = embeddedObject?.imageProperties?.contentUri;
        if (!embedId && embeddedObject?.imageProperties?.sourceUri) {
          embedId = embeddedObject.imageProperties.sourceUri;
        }

        if (embedId) {
          // It's an image, get its properties
          let width = null;
          let height = null;
          let rotation = null;

          if (embeddedObject.size) {
            width = embeddedObject.size.width
              ? Math.round(embeddedObject.size.width.magnitude * 1.333)
              : null;
            height = embeddedObject.size.height
              ? Math.round(embeddedObject.size.height.magnitude * 1.333)
              : null;
            rotation = embeddedObject.rotation || 0;
          }

          objectsData[id] = {
            type: "image",
            uri: embedId,
            width: width,
            height: height,
            rotation: rotation,
          };
        } else {
          console.warn(`Unrecognized object type for ${id}`, embeddedObject);
        }
      }
      // Check if it's a richLink
      else if (allRichLinks[id]) {
        const richLink = allRichLinks[id];
        // Extract the URL and metadata from the richLink
        let uri = richLink.uri;
        let title = richLink.title || "Link to file";
        let description = richLink.description || "";
        let mimeType = null;

        // Also check in richLinkProperties (this is the usual structure)
        if (richLink.richLinkProperties) {
          uri = uri || richLink.richLinkProperties.uri;
          title = richLink.richLinkProperties.title || title;
          mimeType = richLink.richLinkProperties.mimeType || null;
        }

        // Determine the file type for the icon based on MIME Type or URL
        let fileType = "document";
        let fileTypeSource = "default";

        // If we have a mimeType, use it as priority
        if (mimeType) {
          fileTypeSource = "mime-type";
          if (mimeType.includes("spreadsheet")) {
            fileType = "spreadsheet";
          } else if (mimeType.includes("presentation")) {
            fileType = "presentation";
          } else if (mimeType.includes("form")) {
            fileType = "form";
          } else if (mimeType.includes("drawing")) {
            fileType = "drawing";
          } else if (
            mimeType.includes("video") ||
            mimeType.includes("youtube")
          ) {
            fileType = "video";
          } else if (mimeType.includes("image")) {
            fileType = "image";
          } else if (mimeType.includes("pdf")) {
            fileType = "pdf";
          } else if (mimeType.includes("document")) {
            fileType = "document";
          }
        }
        // If no mimeType or if it remained "document" by default, try with the URI
        else if (uri) {
          fileTypeSource = "uri";
          // Common image extensions
          const imageExtensions = [
            ".jpg",
            ".jpeg",
            ".png",
            ".gif",
            ".bmp",
            ".webp",
            ".svg",
            ".tiff",
          ];
          // Common video extensions
          const videoExtensions = [
            ".mp4",
            ".webm",
            ".avi",
            ".mov",
            ".wmv",
            ".flv",
            ".mkv",
          ];

          // Check if the URL matches a Google service
          if (uri.includes("spreadsheets")) {
            fileType = "spreadsheet";
          } else if (uri.includes("presentation")) {
            fileType = "presentation";
          } else if (uri.includes("forms")) {
            fileType = "form";
          } else if (uri.includes("drawings")) {
            fileType = "drawing";
          } else if (uri.includes("youtube") || uri.includes("youtu.be")) {
            fileType = "video";
          } else {
            // Check file extensions
            const lowerUrl = uri.toLowerCase();

            // Check if it's an image
            if (imageExtensions.some((ext) => lowerUrl.endsWith(ext))) {
              fileType = "image";
            }
            // Check if it's a video
            else if (videoExtensions.some((ext) => lowerUrl.endsWith(ext))) {
              fileType = "video";
            }

            // Also check in the title if it's an image/video
            if (fileType === "document" && title) {
              const lowerTitle = title.toLowerCase();
              if (imageExtensions.some((ext) => lowerTitle.endsWith(ext))) {
                fileType = "image";
                fileTypeSource = "title-extension";
              } else if (
                videoExtensions.some((ext) => lowerTitle.endsWith(ext))
              ) {
                fileType = "video";
                fileTypeSource = "title-extension";
              }
            }
          }
        }

        objectsData[id] = {
          type: "driveFile",
          url: uri,
          title: title,
          description: description,
          fileType: fileType,
          mimeType: mimeType,
          fileTypeSource: fileTypeSource,
        };
      }
    }

    return objectsData;
  } catch (error) {
    console.error("Error fetching inline objects:", error);
    return {};
  }
}

function generateSiteHtml(docTitle, tabsData, objectData) {
  // Create a copy of objectData without base64 data for the script
  const scriptObjectData = {};
  for (const [key, value] of Object.entries(objectData)) {
    scriptObjectData[key] = { ...value };

    // Remove large base64 data from the script
    if (scriptObjectData[key].type === "image") {
      // Keep only metadata, not base64 content
      delete scriptObjectData[key].base64;

      // Add the local image path for the script
      const mimeType = value.base64
        ? value.base64.split(";")[0].split(":")[1]
        : "image/png";
      const extension = mimeType.split("/")[1] || "png";
      scriptObjectData[key].localSrc = `images/${key}.${extension}`;
    }
  }

  // Convert inline object data (without base64) to JSON string for the script
  const imageDataString = JSON.stringify(scriptObjectData);

  // Replace image paths in the HTML
  let processedTabsData = JSON.parse(JSON.stringify(tabsData)); // Deep clone
  processedTabsData = processTabsContent(processedTabsData, objectData);

  const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${docTitle}</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <div class="sidebar">
    <button class="menu-toggle">☰ Menu</button>
    <h3>${docTitle}</h3>
    <div class="nav-menu">
      ${generateNavigationMenu(tabsData)}
    </div>
  </div>
  <div class="content">
    ${generateTabContent(processedTabsData)}
  </div>
  <script>
  document.addEventListener('DOMContentLoaded', function() {
    const objectData = ${imageDataString};
    
    // Configuration of the responsive menu
    const sidebar = document.querySelector('.sidebar');
    const menuButton = document.querySelector('.menu-toggle');
    
    // Handle menu display on mobile
    menuButton.addEventListener('click', function() {
      sidebar.classList.toggle('expanded');
      this.innerHTML = sidebar.classList.contains('expanded') ? '✕ Close' : '☰ Menu';
    });
    
    // Hide all tabs except the first one
    const tabContents = document.querySelectorAll('.tab-content');
    tabContents.forEach(tab => {
      tab.style.display = "none";
    });
    
    // Display the first tab by default
    const firstTab = document.querySelector('.tab-content');
    const firstLink = document.querySelector('.nav-link');
    if (firstTab) {
      firstTab.style.display = "block";
      firstTab.classList.add('active');
    }
    if (firstLink) firstLink.classList.add('active');
    
    // Function to replace all inline objects
    const replaceInlineObjects = (container) => {
      // Replace inline objects
      container.querySelectorAll('span.inline-object').forEach(obj => {
        const objectId = obj.getAttribute('data-object-id');
        if (!objectId || !objectData[objectId]) {
          obj.textContent = '[Object not available]';
          return;
        }
        
        const data = objectData[objectId];
        
        if (data.type === 'driveFile') {
          // Create a Drive link element
          const link = document.createElement('a');
          link.href = data.url;
          link.target = '_blank';
          link.rel = 'noopener noreferrer';
          link.className = 'drive-file-link';
          
          // Determine the icon based on the file type
          let iconSvg = '';
          switch(data.fileType) {
            case 'spreadsheet':
              iconSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="#0F9D58" d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14z"/><path fill="#0F9D58" d="M9 12H7v2h2v-2zm0-3H7v2h2V9zm0 6H7v2h2v-2zm6-6h-4v2h4V9zm0 3h-4v2h4v-2zm0 3h-4v2h4v-2z"/></svg>';
              break;
            case 'presentation':
              iconSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="#F4B400" d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14z"/><path fill="#F4B400" d="M11 12V9h2v3h3v2h-3v3h-2v-3H8v-2h3z"/></svg>';
              break;
            case 'form':
              iconSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="#673AB7" d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14z"/><path fill="#673AB7" d="M7 7h10v2H7zm0 4h10v2H7zm0 4h7v2H7z"/></svg>';
              break;
            case 'image':
              iconSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="#34A853" d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14z"/><path fill="#34A853" d="M14.5 11l-3 4.5-2-3L7 16h10l-2.5-5z"/><circle fill="#34A853" cx="8.5" cy="8.5" r="1.5"/></svg>';
              break;
            case 'video':
              iconSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="#EA4335" d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14z"/><path fill="#EA4335" d="M10 8.5v7l5-3.5-5-3.5z"/></svg>';
              break;
            default:
              iconSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="#4285F4" d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14z"/><path fill="#4285F4" d="M7 7h10v2H7zm0 4h10v2H7zm0 4h7v2H7z"/></svg>';
          }
          
          link.innerHTML = \`
            <div class="drive-file-icon">\${iconSvg}</div>
            <div class="drive-file-info">
              <span class="drive-file-title">\${data.title}</span>
              \${data.description ? \`<span class="drive-file-desc">\${data.description}</span>\` : ''}
            </div>
          \`;
          
          // Replace the placeholder with the link
          obj.parentNode.replaceChild(link, obj);
        }
      });
    };
    
    // Function to automatically generate tables of contents
    const generateTableOfContents = () => {
      const activeTab = document.querySelector('.tab-content.active');
      const tocPlaceholders = activeTab ? activeTab.querySelectorAll('.toc-placeholder[data-auto-generated="true"]') : [];
      
      if (tocPlaceholders.length === 0) return;
      
      // Find all headings in the active tab
      const headings = activeTab.querySelectorAll('h1[id]:not(.tab_title), h2[id], h3[id], h4[id], h5[id], h6[id]');
      
      if (headings.length === 0) return;
      
      // Generate the HTML for the table of contents
      const tocHtml = document.createElement('ul');
      tocHtml.className = 'toc-list';
      
      headings.forEach(heading => {
        const level = parseInt(heading.tagName.charAt(1));
        const item = document.createElement('li');
        item.className = \`toc-item toc-level-\${level}\`;
        item.style.marginLeft = \`\${(level-1) * 20}px\`;
        
        const link = document.createElement('a');
        link.href = \`#\${heading.id}\`;
        link.textContent = heading.textContent;
        link.addEventListener('click', function(e) {
          e.preventDefault();
          heading.scrollIntoView({ behavior: 'smooth' });
          
          // Temporarily highlight the target heading
          const originalBg = heading.style.backgroundColor;
          heading.style.backgroundColor = '#ffff99';
          setTimeout(() => {
            heading.style.backgroundColor = originalBg;
          }, 2000);
        });
        
        item.appendChild(link);
        tocHtml.appendChild(item);
      });
      
      // Fill the placeholders
      tocPlaceholders.forEach(placeholder => {
        placeholder.innerHTML = '';
        placeholder.appendChild(tocHtml.cloneNode(true));
      });
    };
    
    // Replace objects in the initial active tab
    replaceInlineObjects(firstTab);
    
    // Generate tables of contents
    generateTableOfContents();
    
    // Add event listeners to all navigation links
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
      link.addEventListener('click', function(e) {
        e.preventDefault();
        
        // Remove the active class from all links and contents
        navLinks.forEach(l => l.classList.remove('active'));
        tabContents.forEach(tab => {
          tab.classList.remove('active');
          tab.style.display = "none";
        });
        
        // Add the active class to the clicked link and content
        this.classList.add('active');
        const targetId = this.getAttribute('href').substring(1);
        const targetTab = document.getElementById(targetId);
        if (targetTab) {
          targetTab.classList.add('active');
          targetTab.style.display = "block";
          
          // Replace objects in the newly displayed tab
          replaceInlineObjects(targetTab);
          
          // Generate tables of contents for the new tab
          setTimeout(() => {
            generateTableOfContents();
          }, 100);
        }
        
        // Close the menu on mobile after selecting a tab
        if (window.innerWidth <= 768) {
          sidebar.classList.remove('expanded');
          menuButton.innerHTML = '☰ Menu';
        }
      });
    });
  });
</script>
</body>
</html>
  `;

  return html;
}
// Function to generate the navigation menu with a recursive structure
function generateNavigationMenu(tabsData, level = 0) {
  if (!tabsData || tabsData.length === 0) return "";

  let menuHtml = "<ul>";

  for (const tab of tabsData) {
    menuHtml += `<li class="nav-item">
      <a href="#${tab.id}" class="nav-link">${tab.title}</a>`;

    if (tab.childTabs && tab.childTabs.length > 0) {
      menuHtml += generateNavigationMenu(tab.childTabs, level + 1);
    }

    menuHtml += "</li>";
  }

  menuHtml += "</ul>";
  return menuHtml;
}

// Function to get existing images
async function getExistingImages(folderName = "") {
  try {
    const response = await fetch("list_images.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        folderName: folderName,
      }),
    });

    if (!response.ok) {
      console.warn("Unable to fetch the list of existing images");
      return {};
    }
    const data = await response.json();
    return data.success ? data.images : {};
  } catch (error) {
    console.warn("Error fetching existing images:", error);
    return {};
  }
}

// Function to generate tab content
function generateTabContent(tabsData) {
  let contentHtml = "";

  for (const tab of tabsData) {
    contentHtml += `<div id="${tab.id}" class="tab-content">
      <h1 class="tab_title">${tab.title}</h1>
      <div>${tab.content}</div>
    </div>`;

    if (tab.childTabs && tab.childTabs.length > 0) {
      contentHtml += generateTabContent(tab.childTabs);
    }
  }

  return contentHtml;
}

//  function to preprocess tab content and adjust image links

function processTabsContent(tabsData, objectData, folderName = "") {
  for (const tab of tabsData) {
    // Process HTML content to adjust image paths
    if (tab.content) {
      tab.content = tab.content.replace(
        /<span id="([^"]+)" class="inline-object" data-object-id="([^"]+)">\[Object loading...\]<\/span>/g,
        (match, id, objectId) => {
          const obj = objectData[objectId];
          if (!obj) return match;

          if (obj.type === "image") {
            // Determine the extension from the MIME type or use .png by default
            const mimeType = obj.base64
              ? obj.base64.split(";")[0].split(":")[1]
              : "image/png";
            const extension = mimeType.split("/")[1] || "png";

            // Add width and height attributes if available
            const widthAttr = obj.width ? ` width="${obj.width}"` : "";
            const heightAttr = obj.height ? ` height="${obj.height}"` : "";

            // If a rotation is specified, add a CSS style
            const rotationStyle = obj.rotation
              ? ` style="transform: rotate(${obj.rotation}rad);"`
              : "";

            // Use the correct relative path for images
            const imagePath = "images";

            return `<img src="${imagePath}/${objectId}.${extension}" alt="Image" class="inline-image" id="${id}" data-object-id="${objectId}"${widthAttr}${heightAttr}${rotationStyle}>`;
          } else if (obj.type === "driveFile") {
            // Keep the content as is for Drive files
            return match;
          }
          return match;
        }
      );
    }

    // Recursively process child tabs
    if (tab.childTabs && tab.childTabs.length > 0) {
      tab.childTabs = processTabsContent(tab.childTabs, objectData, folderName);
    }
  }

  return tabsData;
}
async function saveGeneratedSite(htmlContent, imagesData, docTitle) {
  try {
    // Generate a sanitized folder name based solely on the document title
    const sanitizedTitle = docTitle
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "") // Remove all special characters
      .replace(/\s+/g, "-") // Replace spaces with hyphens
      .replace(/-+/g, "-") // Avoid multiple hyphens
      .trim();

    // Use only the sanitized title as the folder name
    const folderName = sanitizedTitle;

    // Create the main output folder and subfolders (or reuse if it exists)
    const createFoldersResponse = await fetch("create_folders.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        mainFolder: folderName, // Pass the unique folder name to the PHP script
      }),
    });

    if (!createFoldersResponse.ok) {
      throw new Error(
        `Error creating folders: ${createFoldersResponse.status}`
      );
    }

    const folderInfo = await createFoldersResponse.json();

    // Save the main HTML file in the unique folder
    const filename = `${folderName}/index.html`;

    const saveHtmlResponse = await fetch("save_file.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        filename: filename,
        content: htmlContent,
      }),
    });

    if (!saveHtmlResponse.ok) {
      throw new Error(`Error saving HTML file: ${saveHtmlResponse.status}`);
    }

    const saveHtmlResponseData = await saveHtmlResponse.json();

    // Process and save each image in the images subfolder
    const savedImages = {};

    for (const [objectId, imageData] of Object.entries(imagesData)) {
      if (imageData.type === "image") {
        try {
          // If the image has a local path, it already exists and does not need to be saved
          if (imageData.skipProcessing && imageData.localFilePath) {
            savedImages[objectId] = imageData.localFilePath;
            continue;
          }

          // Otherwise, save the image if it has base64 data
          if (imageData.base64) {
            // Extract the extension from the MIME type or use .png by default
            const mimeType =
              imageData.base64.split(";")[0].split(":")[1] || "image/png";
            const extension = mimeType.split("/")[1] || "png";

            // Relative path to the unique folder
            const imageFilename = `${folderName}/images/${objectId}.${extension}`;

            const response = await fetch("save_image.php", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                filename: imageFilename,
                base64data: imageData.base64,
              }),
            });

            if (!response.ok) {
              throw new Error(
                `HTTP error ${response.status}: ${await response.text()}`
              );
            }

            const data = await response.json();
            if (!data.success) {
              throw new Error(
                `Save failed: ${data.message || "Unknown error"}`
              );
            }

            // Save the local image path for HTML update
            savedImages[objectId] = data.path;
          }
        } catch (imageError) {
          console.error(`Error processing image ${objectId}:`, imageError);
          // Continue with other images even if one fails
        }
      }
    }

    // Get the base URL to access the generated site
    const baseUrlResponse = await fetch("get_base_url.php");
    if (!baseUrlResponse.ok) {
      throw new Error(`Error getting base URL: ${baseUrlResponse.status}`);
    }

    const { baseUrl } = await baseUrlResponse.json();
    const siteUrl = `${baseUrl}/output/${folderName}/index.html`;

    return {
      success: true,
      url: siteUrl,
      folder: folderName,
      savedImages: savedImages,
      folderExisted: folderInfo.exists || false,
    };
  } catch (error) {
    console.error("Error saving site:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}
async function displayGeneratedSite(htmlContent, imageData, docTitle) {
  try {
    // Display a loading message
    const resultContainer =
      document.getElementById("parse-result") || document.body;
    resultContainer.innerHTML = `
      <div style="text-align: center; padding: 20px;">
        <p>Generating site...</p>
        <div class="spinner" style="border: 4px solid #f3f3f3; border-top: 4px solid #3498db; border-radius: 50%; width: 30px; height: 30px; animation: spin 1s linear infinite; margin: 0 auto;"></div>
      </div>
      <style>@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }</style>
    `;

    // First, fetch the app configuration to check if server storage is enabled
    const configResponse = await fetch("get_app_config.php");
    const config = await configResponse.json();

    // If server storage is enabled, save the site on server. Otherwise, skip this step.
    let result = { success: false };
    if (config.server_storage && config.server_storage.enabled) {
      // Save the site and images to server
      result = await saveGeneratedSite(htmlContent, imageData, docTitle);
    } else {
      // In client-only mode, create the ZIP directly without saving to server
      result = {
        success: true,
        clientOnly: true,
        docTitle: docTitle,
      };
    }

    // Create the UI to access the generated content
    const downloadContainer = document.createElement("div");
    downloadContainer.style.marginTop = "20px";
    downloadContainer.style.padding = "15px";
    downloadContainer.style.border = "1px solid #ccc";
    downloadContainer.style.backgroundColor = "#f9f9f9";
    downloadContainer.style.borderRadius = "5px";

    const downloadHeading = document.createElement("h3");
    downloadHeading.textContent = "Site generated successfully!";
    downloadHeading.style.color = "#34a853";

    // Action buttons container
    const actionContainer = document.createElement("div");
    actionContainer.style.display = "flex";
    actionContainer.style.gap = "10px";
    actionContainer.style.margin = "15px 0";

    // Add information text based on the storage mode
    const infoMessage = document.createElement("p");

    if (result.clientOnly) {
      infoMessage.innerHTML = `<strong>Client-Only Mode:</strong> The site has been generated in your browser and is ready for download.
        <br>No files have been stored on the server.`;

      // Create a hidden form to submit for creating ZIP without server storage
      const form = document.createElement("form");
      form.method = "POST";
      form.action = "create_zip_from_memory.php";
      form.style.display = "none";

      // Add HTML content as hidden input
      const htmlInput = document.createElement("input");
      htmlInput.type = "hidden";
      htmlInput.name = "html_content";
      htmlInput.value = htmlContent;
      form.appendChild(htmlInput);

      // Add document title
      const titleInput = document.createElement("input");
      titleInput.type = "hidden";
      titleInput.name = "doc_title";
      titleInput.value = docTitle;
      form.appendChild(titleInput);

      // Add serialized image data
      const imagesInput = document.createElement("input");
      imagesInput.type = "hidden";
      imagesInput.name = "image_data";

      // Debug the structure of imageData before sending
      console.log("Image data structure:", imageData);

      // Make sure base64 data is included in each image
      const processedImageData = {};
      for (const [id, image] of Object.entries(imageData)) {
        // Check if the image has all required properties
        if (image && image.type === "image") {
          if (!image.base64) {
            // If possible, try to get the base64 data dynamically
            if (image.uri) {
              try {
                // Utiliser la fonction existante convertImageToBase64 au lieu de fetchImageAsBase64
                const base64Data = await convertImageToBase64(image.uri);
                if (base64Data) {
                  processedImageData[id] = {
                    ...image,
                    base64: base64Data,
                  };
                  console.log(`Image ${id} converted to base64 successfully`);
                } else {
                  console.warn(`Failed to convert image ${id} to base64`);
                  processedImageData[id] = image;
                }
              } catch (error) {
                console.error(`Error converting image ${id} to base64:`, error);
                processedImageData[id] = image;
              }
            } else {
              console.warn(`Image ${id} has no URI to convert`);
              processedImageData[id] = image;
            }
          } else {
            processedImageData[id] = image;
          }
        } else {
          processedImageData[id] = image;
        }
      }

      imagesInput.value = JSON.stringify(processedImageData);
      form.appendChild(imagesInput);

      // Add form to document
      document.body.appendChild(form);

      // Download as ZIP button (submits the form)
      const downloadZipButton = document.createElement("button");
      downloadZipButton.textContent = "Download as ZIP";
      downloadZipButton.classList.add("download-zip-button");
      downloadZipButton.style.display = "inline-block";
      downloadZipButton.style.padding = "10px 15px";
      downloadZipButton.style.backgroundColor = "#FF9800"; // Orange
      downloadZipButton.style.color = "white";
      downloadZipButton.style.border = "none";
      downloadZipButton.style.borderRadius = "4px";
      downloadZipButton.style.cursor = "pointer";
      downloadZipButton.style.textDecoration = "none";
      downloadZipButton.style.textAlign = "center";
      downloadZipButton.style.minWidth = "150px";

      // When clicked, submit the form
      downloadZipButton.addEventListener("click", function () {
        form.submit();
      });

      actionContainer.appendChild(downloadZipButton);
    } else if (result.success) {
      // Server storage mode - show both online view and download options
      infoMessage.textContent =
        "The site has been generated successfully. You can view it online or download it as a ZIP archive.";

      // View site button
      const siteLink = document.createElement("a");
      siteLink.href = result.url;
      siteLink.target = "_blank";
      siteLink.className = "site-link";
      siteLink.textContent = "View Generated Site";
      siteLink.style.display = "inline-block";
      siteLink.style.padding = "10px 15px";
      siteLink.style.backgroundColor = "#4CAF50"; // Green
      siteLink.style.color = "white";
      siteLink.style.borderRadius = "4px";
      siteLink.style.textDecoration = "none";
      siteLink.style.textAlign = "center";
      siteLink.style.minWidth = "150px";

      // Download as ZIP button
      const downloadZipLink = document.createElement("a");
      downloadZipLink.href = `download_site.php?folder=${result.folder}`;
      downloadZipLink.className = "download-zip-link";
      downloadZipLink.textContent = "Download as ZIP";
      downloadZipLink.style.display = "inline-block";
      downloadZipLink.style.padding = "10px 15px";
      downloadZipLink.style.backgroundColor = "#FF9800"; // Orange
      downloadZipLink.style.color = "white";
      downloadZipLink.style.borderRadius = "4px";
      downloadZipLink.style.textDecoration = "none";
      downloadZipLink.style.textAlign = "center";
      downloadZipLink.style.minWidth = "150px";

      // Add buttons to container
      actionContainer.appendChild(siteLink);
      actionContainer.appendChild(downloadZipLink);
    } else {
      infoMessage.innerHTML = `<strong>Error:</strong> ${
        result.error || "Failed to generate the site."
      }`;
    }

    // Add elements to the main container
    downloadContainer.appendChild(downloadHeading);
    downloadContainer.appendChild(infoMessage);
    downloadContainer.appendChild(actionContainer);

    resultContainer.innerHTML = "";
    resultContainer.appendChild(downloadContainer);
  } catch (error) {
    console.error("Error displaying generated site:", error);
    const resultContainer =
      document.getElementById("parse-result") || document.body;
    resultContainer.innerHTML = `
      <div style="padding: 20px; color: #721c24; background-color: #f8d7da; border: 1px solid #f5c6cb; border-radius: 5px;">
        <h3>Unexpected error</h3>
        <p>${error.message}</p>
      </div>
    `;
  }
}
async function convertImageToBase64(url) {
  try {
    // Check if the URL is already in base64
    if (url.startsWith("data:image")) {
      return url;
    }

    const proxyUrl = `proxy_googlecontent.php?url=${encodeURIComponent(url)}`;

    const response = await fetch(proxyUrl);
    if (!response.ok) {
      console.error(
        "Failed to fetch image from proxy:",
        response.status,
        response.statusText
      );
      return null;
    }

    // Check the content type to confirm it's an image
    const contentType = response.headers.get("content-type");
    if (contentType && !contentType.startsWith("image/")) {
      console.warn(`Content is not an image (${contentType}). URL: ${url}`);
    }

    const blob = await response.blob();

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(reader.result);
      };
      reader.onerror = (e) => {
        console.error("Error reading blob as data URL:", e);
        reject(e);
      };
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error("Error converting image to base64:", error);
    return null;
  }
}

function cleanControlCharacters(text) {
  if (!text) return text;

  // Only remove specific problematic characters
  return text
    .replace(/\u000B/g, "") // Vertical Tab
    .replace(/\u000C/g, "") // Form Feed
    .replace(/[\u0000-\u0008\u000E-\u001F\u007F-\u009F]/g, ""); // Other control characters
}
