var tokenClient;
var clientId;
var Google_apikey;
var OpenAI_apikey;
var accessToken;

// Ajoutez cette fonction à vos fonctions.js

// Fonction pour extraire l'ID du document depuis l'URL
function extractGoogleDocId(url) {
  // Modèle d'URL: https://docs.google.com/document/d/DOCUMENT_ID/edit
  // ou https://docs.google.com/document/d/DOCUMENT_ID/
  if (!url) return null;

  try {
    const regex = /\/document\/d\/([-\w]{25,})/;
    const match = url.match(regex);
    return match ? match[1] : null;
  } catch (error) {
    console.error("Erreur lors de l'extraction de l'ID du document:", error);
    return null;
  }
}

// Initialiser le gestionnaire d'événements pour le formulaire
document.addEventListener("DOMContentLoaded", function () {
  const urlForm = document.getElementById("url-form");
  if (urlForm) {
    urlForm.addEventListener("submit", function (event) {
      event.preventDefault();

      const docUrl = document.getElementById("doc-url").value.trim();
      const docId = extractGoogleDocId(docUrl);

      if (docId) {
        console.log("ID du document extrait:", docId);
        sessionStorage.setItem("fileId", docId);
        showFilePreview(docId);
      } else {
        alert(
          "URL du document Google invalide. Assurez-vous que l'URL est au format: https://docs.google.com/document/d/DOCUMENT_ID/edit"
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

  clientId = localStorage.getItem("client_id") || "";
  Google_apikey = localStorage.getItem("Google-apikey") || "";
  OpenAI_apikey = localStorage.getItem("OpenAI-apikey") || "";

  document.getElementById("client-id").value = clientId;
  document.getElementById("Google-api-key").value = Google_apikey;
  document.getElementById("OpenAI-api-key").value = OpenAI_apikey;

  if (sessionStorage.getItem("accessToken")) {
    accessToken = sessionStorage.getItem("accessToken");
    console.log("Access token found in session storage: " + accessToken);
    const isValid = await checkAccessToken(accessToken);
    if (!isValid) {
      console.log("Access token is invalid, requesting a new one...");
      await requestAccessToken();
    }

    await initializeGoogleApiClient(); // Await the initialization of Google API client
  } else if (clientId && Google_apikey) {
    console.log("Client ID and API key found in local storage.");
    await requestAccessToken();
    console.log("Setting pick-file button to visible");
    document.getElementById("pick-file").style.display = "block";
    await initializeGoogleApiClient(); // Await the initialization of Google API client
  } else {
    document.getElementById("warning-message").style.display = "block";
    // await Promise.resolve(); // Await a resolved promise
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

  if (!tokenClient) {
    // Créer le tokenClient une seule fois
    tokenClient = await google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: [
        "https://www.googleapis.com/auth/drive.metadata.readonly",
        "https://www.googleapis.com/auth/documents",
        "https://www.googleapis.com/auth/documents.readonly",
        "https://www.googleapis.com/auth/drive",
        "https://www.googleapis.com/auth/drive.readonly",
        "https://www.googleapis.com/auth/drive.file",
        "https://www.googleapis.com/auth/drive.resource",
      ].join(" "),
      callback: (response) => {
        if (response.error) {
          console.error("Error during token request:", response.error);
          // Rejeter la Promise
          reject(response.error);
          return;
        }
        console.log("Access token acquired:", response.access_token);
        accessToken = response.access_token;
        sessionStorage.setItem("accessToken", accessToken);
        gapi.client.setToken({ access_token: accessToken });
        // Résoudre la Promise
        resolve();
      },
    });
  }

  // Renvoyer une Promise
  return new Promise((resolve, reject) => {
    tokenClient.requestAccessToken();
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
      // throw new Error("Token is invalid");
    }

    // Vérifiez si le token est expiré ou invalide
    if (data.error || data.expires_in <= 0) {
      console.log("Token is invalid or expired:", data.error || "Expired");
      return false;
    }
    // console.log("Token is valid:", data);
    return true;
  } catch (error) {
    // console.log("Error checking token:", error);
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

async function loadPicker() {
  console.log("\n\n Loading Google Picker...");

  //au cas où gapi n'est pas défini
  await loadGoogleApiScript();

  if (!accessToken) {
    console.log("No access token available, requesting one...");
    await requestAccessToken();
    console.log("lancement du picker");
    gapi.load("picker", { callback: onPickerApiLoad });
  } else {
    const isValid = await checkAccessToken(accessToken);
    if (!isValid) {
      console.log("Access token is invalid, requesting a new one...");
      await requestAccessToken();
      console.log("lancement du picker");
      gapi.load("picker", { callback: onPickerApiLoad });
    } else {
      console.log("Access token is valid:", accessToken);
      console.log("lancement du picker");
      gapi.load("picker", { callback: onPickerApiLoad });
    }
  }
}

function onPickerApiLoad() {
  console.log("Picker loading.");
  // Vue en liste
  const docsView = new google.picker.DocsView(google.picker.ViewId.DOCUMENTS);

  const picker = new google.picker.PickerBuilder()
    .setAppId(Google_apikey)
    .setDeveloperKey(Google_apikey)
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

    // Remplir le champ d'URL avec l'URL complète du document sélectionné
    const docUrl = `https://docs.google.com/document/d/${fileId}/edit`;
    document.getElementById("doc-url").value = docUrl;

    showFilePreview(fileId);
  }
}

async function showFilePreview(fileId) {
  console.log("Fetching file preview for file ID: " + fileId);
  //au cas où gapi n'est pas défini

  if (typeof gapi.client === "undefined") {
    console.log("gapi.client is not defined. ");
    await initializeGoogleApiClient();
  }

  gapi.client.setApiKey(Google_apikey);
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

    //affichage d'une vue du fichier sélectionné
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

    // Créer un objet pour stocker toutes les listes de tous les onglets
    let allLists = {};

    // Ajouter les listes du document principal
    if (docData.lists) {
      // console.log(
      //   "Listes trouvées dans le document principal:",
      //   Object.keys(docData.lists).length
      // );
      allLists = { ...allLists, ...docData.lists };
    }

    // Ajouter les listes de chaque onglet
    if (tabs && tabs.length > 0) {
      for (const tab of tabs) {
        if (tab.documentTab && tab.documentTab.lists) {
          // console.log(
          //   `Listes trouvées dans l'onglet ${
          //     tab.tabProperties?.title || "sans nom"
          //   }:`,
          //   Object.keys(tab.documentTab.lists).length
          // );
          allLists = { ...allLists, ...tab.documentTab.lists };
        }

        // Fonction récursive pour récupérer les listes des sous-onglets
        const getListsFromChildTabs = (childTabs) => {
          if (!childTabs) return;

          for (const childTab of childTabs) {
            if (childTab.documentTab && childTab.documentTab.lists) {
              // console.log(
              //   `Listes trouvées dans le sous-onglet ${
              //     childTab.tabProperties?.title || "sans nom"
              //   }:`,
              //   Object.keys(childTab.documentTab.lists).length
              // );
              allLists = { ...allLists, ...childTab.documentTab.lists };
            }

            if (childTab.childTabs && childTab.childTabs.length > 0) {
              getListsFromChildTabs(childTab.childTabs);
            }
          }
        };

        // Récupérer les listes des sous-onglets
        if (tab.childTabs && tab.childTabs.length > 0) {
          getListsFromChildTabs(tab.childTabs);
        }
      }
    }

    console.log(
      "Total des listes trouvées dans tout le document:",
      Object.keys(allLists).length
    );

    // Utiliser toutes les listes collectées au lieu de seulement docData.lists
    const docLists = allLists;
    // console.log("docLists complet:", docLists);

    // Fonction pour traiter le contenu avec l'objet lists
    const processTabContentWithLists = (content, lists) => {
      if (!content) return "";
      return parseTabContent(content, lists);
    };

    // Générer un nom de dossier sanitisé pour le document
    const sanitizedTitle = docTitle
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "") // Supprimer tous les caractères spéciaux
      .replace(/\s+/g, "-") // Remplacer les espaces par des tirets
      .replace(/-+/g, "-") // Éviter les tirets multiples
      .trim();

    // Utiliser le nom du document comme nom de dossier
    const folderName = sanitizedTitle;

    // Récupérer la liste des images existantes
    const existingImages = await getExistingImages(folderName);
    console.log(
      "Images existantes trouvées:",
      Object.keys(existingImages).length
    );

    // Extraire tous les IDs d'objets inline (images)
    const inlineObjectIds = [];
    const processContent = (content) => {
      if (!content) return;

      for (const element of content) {
        if (element.paragraph) {
          for (const paraElement of element.paragraph.elements) {
            // Détecter les objets inline standard (images et liens)
            if (
              paraElement.inlineObjectElement &&
              paraElement.inlineObjectElement.inlineObjectId
            ) {
              inlineObjectIds.push(
                paraElement.inlineObjectElement.inlineObjectId
              );
            }

            // Détecter les richLinks (liens Google Drive sous forme de puces)
            else if (paraElement.richLink) {
              console.log("Found richLink:", paraElement.richLink);
              if (paraElement.richLink.richLinkId) {
                inlineObjectIds.push(paraElement.richLink.richLinkId);
              }
            }
            // Autres détections existantes...
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

        // Vérifier si l'élément lui-même est un objet inline ou un lien Drive
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

    // Traiter le contenu principal pour trouver les objets inline
    processContent(docData.body?.content);

    // Traiter les onglets pour trouver les objets inline
    for (const tab of tabs) {
      if (tab.documentTab?.body?.content) {
        processContent(tab.documentTab.body.content);
      }

      // Parcourir récursivement les sous-onglets
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

    // Récupérer les données des objets inline
    const inlineObjectsData = await getInlineObjectsData(
      fileId,
      inlineObjectIds
    );

    // Convertir les URIs des images en base64 seulement si nécessaire
    const imagePromises = [];
    for (const id in inlineObjectsData) {
      if (inlineObjectsData[id].type === "image" && inlineObjectsData[id].uri) {
        // Vérifier si l'image existe déjà
        if (existingImages[id]) {
          console.log(
            `Image ${id} déjà existante, réutilisation du fichier local`
          );

          // Ajouter des informations sur le fichier local au lieu du base64
          const extension = existingImages[id].extension;
          inlineObjectsData[id].localFilePath = `images/${id}.${extension}`;
          inlineObjectsData[id].skipProcessing = true; // Marquer pour éviter le traitement ultérieur
        } else {
          // L'image n'existe pas, il faut la convertir en base64
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

    // Attendre que toutes les images soient converties
    await Promise.all(imagePromises);

    // Structure pour stocker les données des onglets
    let tabsData = [];

    // Récupérer la structure et le contenu des onglets
    // Remplir la structure tabsData avec les onglets principaux
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

        // Récupérer le contenu de l'onglet
        if (
          tab.documentTab &&
          tab.documentTab.body &&
          tab.documentTab.body.content
        ) {
          // Utiliser processTabContentWithLists pour passer docLists à parseTabContent
          tabInfo.content = processTabContentWithLists(
            tab.documentTab.body.content,
            docLists
          );
        }

        // Récupérer les sous-onglets récursivement
        if (tab.childTabs && tab.childTabs.length > 0) {
          getChildTabsWithLists(tab.childTabs, tabInfo.childTabs, docLists);
        }

        tabsData.push(tabInfo);
      }
    } else {
      // Si pas d'onglets, créer un onglet principal avec le contenu du document
      const mainTabInfo = {
        id: `main-tab-${Date.now()}`,
        title: docTitle,
        content: processTabContentWithLists(docData.body.content, docLists),
        childTabs: [],
      };
      tabsData.push(mainTabInfo);
    }

    // Traiter les chemins d'images dans le contenu des onglets
    tabsData = processTabsContent(tabsData, inlineObjectsData, folderName);

    // Générer le HTML du site
    const siteHtml = generateSiteHtml(docTitle, tabsData, inlineObjectsData);

    console.log("HTML généré longueur:", siteHtml ? siteHtml.length : 0);

    // Afficher ou télécharger le résultat
    displayGeneratedSite(siteHtml, inlineObjectsData, docTitle);

    return tabsData;
  } catch (error) {
    console.error("Error generating site from document:", error);
    return Promise.reject(error);
  }
}
// Fonction récursive pour obtenir tous les sous-onglets
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

    // Récupérer le contenu du sous-onglet - s'il a un documentTab
    if (
      childTab.documentTab &&
      childTab.documentTab.body &&
      childTab.documentTab.body.content
    ) {
      // Fusionner les listes de l'onglet avec les listes déjà collectées
      if (childTab.documentTab.lists) {
        docLists = { ...docLists, ...childTab.documentTab.lists };
      }
      tabInfo.content = parseTabContent(
        childTab.documentTab.body.content,
        docLists
      );
    }

    // Récursivement obtenir les sous-sous-onglets
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
  let openLists = []; // Pile pour suivre les listes ouvertes avec leurs types

  // Fonction qui détermine le type de liste et la classe CSS à utiliser
  function getListTypeAndClass(bullet, nestingLevel, paragraphHtml) {
    // Log détaillé de l'objet bullet pour inspection
    console.log("DEBUG BULLET: ", JSON.stringify(bullet, null, 2));

    let isOrdered = false;
    let cssClass = "";

    // Récupérer le listId pour accéder aux propriétés de la liste dans docLists
    const listId = bullet.listId;

    // Vérifier si nous avons des infos sur cette liste dans docLists
    if (docLists && docLists[listId]) {
      const listProperties = docLists[listId].listProperties;

      if (
        listProperties &&
        listProperties.nestingLevels &&
        listProperties.nestingLevels[nestingLevel]
      ) {
        const nestingLevelProps = listProperties.nestingLevels[nestingLevel];
        console.log(`Propriétés de la liste  ${listId}:`, nestingLevelProps);

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

          // Déterminer la classe CSS
          if (nestingLevelProps.glyphType === "UPPER_ALPHA")
            cssClass = "upper-alpha";
          else if (nestingLevelProps.glyphType === "ALPHA")
            cssClass = "lower-alpha";
          else if (nestingLevelProps.glyphType === "UPPER_ROMAN")
            cssClass = "upper-roman";
          else if (nestingLevelProps.glyphType === "ROMAN")
            cssClass = "lower-roman";

          console.log(
            `Liste détectée comme: ${
              isOrdered ? "ordonnée" : "non ordonnée"
            }, classe: ${cssClass || "aucune"}`
          );
          return {
            tag: isOrdered ? "ol" : "ul",
            class: cssClass,
          };
        }
      }
    } else {
      console.log(
        `Liste avec ID ${listId} non trouvée dans docLists ou docLists non fourni`
      );
    }

    console.log(
      `RÉSULTAT FINAL: tag=${isOrdered ? "ol" : "ul"}, class=${
        cssClass || "aucune"
      }`
    );

    return {
      tag: isOrdered ? "ol" : "ul",
      class: cssClass,
    };
  }

  // Parcourir tous les éléments du contenu
  for (const element of content) {
    if (element.tableOfContents) {
      // Traitement des éléments de type tableOfContents

      // Fermer les listes ouvertes avant d'insérer une table des matières
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

      // Générer le placeholder HTML pour la table des matières
      htmlContent += `<div class="table-of-contents">
        <h3>Table des matières</h3>
        <div class="toc-placeholder" data-auto-generated="true"></div>
      </div>`;

      // Ne pas traiter le contenu de l'élément tableOfContents pour éviter la duplication
    } else if (element.paragraph) {
      const paragraph = element.paragraph;
      let paragraphHtml = "";

      // Traiter les éléments du paragraphe
      for (const paraElement of paragraph.elements || []) {
        if (paraElement.textRun) {
          const text = paraElement.textRun.content;
          // Nettoyer le texte des caractères de contrôle
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
            paragraphHtml += `<span id="${objectId}" class="inline-object" data-object-id="${objectId}">[Objet en cours de chargement...]</span>`;
          } else {
            paragraphHtml += "[Objet intégré]";
          }
        } else if (paraElement.richLink) {
          const richLinkId = paraElement.richLink.richLinkId;
          if (richLinkId) {
            paragraphHtml += `<span id="${richLinkId}" class="inline-object rich-link" data-object-id="${richLinkId}">[Lien Google Drive en cours de chargement...]</span>`;
          } else {
            paragraphHtml += "[Lien Google Drive]";
          }
        }
      }

      // détection du type de l'item de liste et de la classe CSS
      if (paragraph.bullet) {
        const listId = paragraph.bullet.listId;
        // console.log("listId pour ce paragraphe de type bullet:", listId);
        const nestingLevel = paragraph.bullet.nestingLevel || 0;

        console.log(
          `\n ${paragraphHtml.substring(0, 40)} === NIVEAU=${nestingLevel} ===`
        );

        // Déterminer le type et la classe de liste pour ce niveau spécifique
        const listInfo = getListTypeAndClass(
          paragraph.bullet,
          nestingLevel,
          paragraphHtml
        );

        const listTag = listInfo.tag;
        const listClass = listInfo.class ? ` class="${listInfo.class}"` : "";

        console.log(`HTML généré pour la liste: <${listTag}${listClass}>`);

        // Gérer les changements de liste et les niveaux d'imbrication
        if (currentListId !== listId) {
          // Fermer toutes les listes ouvertes si c'est une nouvelle liste
          while (openLists.length > 0) {
            const lastList = openLists.pop();
            htmlContent += `</${lastList.tag}>`;
            console.log(`Fermeture liste: </${lastList.tag}>`);
          }

          // Commencer une nouvelle liste
          htmlContent += `<${listTag}${listClass}>`;
          console.log(`Ouverture nouvelle liste: <${listTag}${listClass}>`);

          openLists.push({
            id: listId,
            tag: listTag,
            level: nestingLevel,
            class: listInfo.class,
          });

          currentListId = listId;
          currentNestingLevel = nestingLevel;
        }
        // Même liste mais niveau différent
        else if (currentNestingLevel !== nestingLevel) {
          console.log(
            `Changement de niveau: ${currentNestingLevel} -> ${nestingLevel}`
          );

          if (nestingLevel > currentNestingLevel) {
            // Avant d'ouvrir une liste imbriquée, s'assurer que nous avons fermé le <li> actuel
            // ou ajouter un <li> si nécessaire, puis ouvrir la nouvelle liste
            for (let i = currentNestingLevel + 1; i <= nestingLevel; i++) {
              // Pour chaque niveau, déterminer son propre type de liste
              // Utiliser les informations du niveau spécifique dans docLists
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

                console.log(
                  `Niveau ${i} trouvé dans docLists: type=${
                    levelInfo.tag
                  }, class=${levelInfo.class || "aucune"}`
                );
              } else {
                // Fallback si les informations spécifiques ne sont pas disponibles
                levelInfo = getListTypeAndClass(paragraph.bullet, i, "");
              }

              const levelTag = levelInfo.tag;
              const levelClass = levelInfo.class
                ? ` class="${levelInfo.class}"`
                : "";

              // Simplement ouvrir la nouvelle liste
              htmlContent += `<${levelTag}${levelClass}>`;
              console.log(
                `Ouverture liste imbriquée niveau ${i}: <${levelTag}${levelClass}>`
              );

              openLists.push({
                id: listId,
                tag: levelTag,
                level: i,
                class: levelInfo.class,
                needsClosingLi: false, // Indiquer qu'il n'y a pas de <li> à fermer
              });
            }
          } else {
            // Fermer les niveaux imbriqués en trop
            const levelDiff = currentNestingLevel - nestingLevel;
            for (let i = 0; i < levelDiff; i++) {
              if (openLists.length > 1) {
                const lastList = openLists.pop();
                // Fermer uniquement la balise de liste sans </li>
                htmlContent += `</${lastList.tag}>`;
                console.log(`Fermeture liste imbriquée: </${lastList.tag}>`);
              }
            }
          }
          currentNestingLevel = nestingLevel;
        }

        // Ajouter l'élément de liste
        htmlContent += `<li>${paragraphHtml}`;
        console.log(
          `Ajout élément de liste: <li>${paragraphHtml.substring(0, 20)}...`
        );
      } else {
        // Fermer toutes les listes ouvertes à la fin
        while (openLists.length > 0) {
          const lastList = openLists.pop();
          if (openLists.length === 0) {
            // Fermer le dernier élément li puis la liste
            htmlContent += `</li></${lastList.tag}>`;
          } else {
            // Pour les listes imbriquées, fermer uniquement la liste
            htmlContent += `</${lastList.tag}>`;
          }
          console.log(`Fermeture liste: </${lastList.tag}>`);
        }
        currentListId = null;
        currentNestingLevel = -1;

        // Traitement normal des paragraphes
        const style =
          paragraph.paragraphStyle && paragraph.paragraphStyle.namedStyleType
            ? paragraph.paragraphStyle.namedStyleType
            : "NORMAL_TEXT";

        if (style.includes("HEADING")) {
          const headingLevel = style.charAt(style.length - 1);
          // Créer un ID basé sur le texte du titre pour les ancres
          let headingId = paragraphHtml
            .replace(/<[^>]+>/g, "") // Supprimer les balises HTML
            .trim()
            .toLowerCase()
            .replace(/[^\w\s-]/g, "") // Supprimer les caractères spéciaux
            .replace(/\s+/g, "-") // Remplacer les espaces par des tirets
            .replace(/--+/g, "-"); // Éviter les tirets multiples

          // Ajouter un suffixe numérique unique si nécessaire
          headingId = `heading-${headingId}-${Date.now()
            .toString()
            .substr(-6)}`;

          // Générer le HTML du titre avec l'attribut ID
          htmlContent += `<h${headingLevel} id="${headingId}">${paragraphHtml}</h${headingLevel}>`;
        } else {
          htmlContent += `<p>${paragraphHtml}</p>`;
        }
      }
    } else if (element.table) {
      // Fermer les listes ouvertes avant d'insérer un tableau
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
      // Fermer les listes ouvertes avant d'insérer une séparation
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

  // Fermer toutes les listes ouvertes à la fin
  while (openLists.length > 0) {
    const lastList = openLists.pop();
    if (openLists.length === 0) {
      // Pour la liste la plus externe, fermer le dernier élément li puis la liste
      htmlContent += `</li></${lastList.tag}>`;
    } else {
      // Pour les listes imbriquées, fermer uniquement la liste
      htmlContent += `</${lastList.tag}>`;
    }
    console.log(`Fermeture liste: </${lastList.tag}>`);
  }

  return htmlContent;
}
// Fonction pour traiter le contenu des tableaux
function parseTableContent(table) {
  if (!table || !table.tableRows) {
    return "";
  }

  let tableHtml =
    "<table border='1' cellpadding='5' cellspacing='0' style='border-collapse: collapse;'>";

  // Traiter chaque ligne du tableau
  for (const row of table.tableRows) {
    tableHtml += "<tr>";

    // Traiter chaque cellule de la ligne
    if (row.tableCells) {
      for (const cell of row.tableCells) {
        // Déterminer si c'est un en-tête (première ligne)
        const isHeader = table.tableRows.indexOf(row) === 0;
        const cellTag = isHeader ? "th" : "td";

        // Récupérer les propriétés de style de la cellule
        let style = "";
        if (cell.tableCellStyle) {
          // Appliquer le remplissage de la cellule si défini
          if (cell.tableCellStyle.backgroundColor) {
            const bg = cell.tableCellStyle.backgroundColor;
            // Convertir la couleur RGB en hexadécimal si nécessaire
            if (bg.color && bg.color.rgbColor) {
              const r = Math.round((bg.color.rgbColor.red || 0) * 255);
              const g = Math.round((bg.color.rgbColor.green || 0) * 255);
              const b = Math.round((bg.color.rgbColor.blue || 0) * 255);
              style += `background-color: rgb(${r}, ${g}, ${b}); `;
            }
          }

          // Gérer la fusion des cellules
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

        // Traiter le contenu de la cellule
        if (cell.content) {
          let cellContent = "";
          for (const element of cell.content) {
            if (element.paragraph) {
              // Traiter le paragraphe dans la cellule
              const paragraph = element.paragraph;
              let paragraphHtml = "";

              if (paragraph.elements) {
                // Convertir les éléments du paragraphe en HTML
                for (const paraElement of paragraph.elements) {
                  if (paraElement.textRun) {
                    const text = paraElement.textRun.content;
                    // Nettoyer le texte des caractères de contrôle
                    const cleanedText = cleanControlCharacters(text);
                    const textStyle = paraElement.textRun.textStyle || {};
                    let formattedText = cleanedText;

                    if (textStyle.link && textStyle.link.url) {
                      // Déterminer si c'est un lien interne (lien vers un titre du document)
                      if (textStyle.link.url.startsWith("#")) {
                        // C'est un lien interne, adapter le format de l'ancre pour correspondre à notre convention
                        const targetText = textStyle.link.url.substring(1); // Enlever le # initial

                        // Créer un ID au format identique à celui utilisé pour les titres
                        const targetId = `heading-${targetText
                          .toLowerCase()
                          .replace(/[^\w\s-]/g, "")
                          .replace(/\s+/g, "-")
                          .replace(/--+/g, "-")}-`;

                        // Utiliser un attribut data-target pour pouvoir faire l'association ultérieurement via JavaScript
                        formattedText = `<a href="javascript:void(0)" class="toc-link" data-target="${targetId}">${formattedText}</a>`;
                      } else {
                        // Lien externe normal
                        formattedText = `<a href="${textStyle.link.url}" target="_blank" rel="noopener noreferrer">${formattedText}</a>`;
                      }
                    } else {
                      // Appliquer les styles de texte
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
                    // Gérer les objets inline dans les tableaux
                    const objectId =
                      paraElement.inlineObjectElement.inlineObjectId;
                    if (objectId) {
                      paragraphHtml += `<span id="${objectId}" class="inline-object" data-object-id="${objectId}">[Objet en cours de chargement...]</span>`;
                    }
                  }
                }
              }

              cellContent += paragraphHtml;
            } else if (element.table) {
              // Gérer les tableaux imbriqués
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
    console.log("Aucun ID d'objet inline trouvé");
    return {};
  }

  console.log(
    `Récupération des données pour ${inlineObjectIds.length} objets inline`
  );

  try {
    // Demander le document avec includeTabsContent: true pour obtenir tous les objets
    const response = await gapi.client.docs.documents.get({
      documentId: fileId,
      includeTabsContent: true,
    });

    const docData = response.result;

    // Collecter tous les inlineObjects du document principal et des onglets
    const allInlineObjects = {};
    // Au lieu d'une collection séparée, nous allons stocker les richLinks par ID dans un objet
    const allRichLinks = {};

    // Ajouter les inlineObjects du document principal
    if (docData.inlineObjects) {
      Object.assign(allInlineObjects, docData.inlineObjects);
    }

    // Fonction pour extraire les richLinks du contenu
    const extractRichLinks = (content) => {
      if (!content) return;

      for (const element of content) {
        if (element.paragraph && element.paragraph.elements) {
          for (const paraElement of element.paragraph.elements) {
            if (paraElement.richLink && paraElement.richLink.richLinkId) {
              // Stocker le richLink par son ID
              allRichLinks[paraElement.richLink.richLinkId] =
                paraElement.richLink;
            }
          }
        }

        // Parcourir récursivement les tableaux
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

    // Extraire les richLinks du document principal
    if (docData.body && docData.body.content) {
      extractRichLinks(docData.body.content);
    }

    // Fonction récursive pour extraire les inlineObjects et richLinks des onglets
    const extractObjectsFromTabs = (tabs) => {
      if (!tabs) return;

      for (const tab of tabs) {
        // Extraire les inlineObjects de chaque onglet
        if (tab.documentTab && tab.documentTab.inlineObjects) {
          console.log(
            `Trouvé ${
              Object.keys(tab.documentTab.inlineObjects).length
            } objets inline dans l'onglet ${
              tab.tabProperties?.title || "sans nom"
            }`
          );
          Object.assign(allInlineObjects, tab.documentTab.inlineObjects);
        }

        // Extraire les richLinks du contenu de chaque onglet
        if (
          tab.documentTab &&
          tab.documentTab.body &&
          tab.documentTab.body.content
        ) {
          extractRichLinks(tab.documentTab.body.content);
        }

        // Explorer récursivement les sous-onglets
        if (tab.childTabs && tab.childTabs.length > 0) {
          extractObjectsFromTabs(tab.childTabs);
        }
      }
    };

    // Traiter les onglets s'ils existent
    if (docData.tabs && docData.tabs.length > 0) {
      extractObjectsFromTabs(docData.tabs);
    }

    console.log(
      `Total d'objets inline trouvés: ${Object.keys(allInlineObjects).length}`
    );
    console.log(
      `Total de richLinks trouvés: ${Object.keys(allRichLinks).length}`
    );
    console.log(`IDs demandés: ${inlineObjectIds.length}`);

    const objectsData = {};

    for (const id of inlineObjectIds) {
      // Vérifier si c'est un objet inline standard (image)
      if (allInlineObjects[id]) {
        const inlineObject = allInlineObjects[id];
        const embeddedObject =
          inlineObject.inlineObjectProperties?.embeddedObject;

        // Vérifier si c'est une image
        let embedId = embeddedObject?.imageProperties?.contentUri;
        if (!embedId && embeddedObject?.imageProperties?.sourceUri) {
          embedId = embeddedObject.imageProperties.sourceUri;
        }

        if (embedId) {
          // C'est une image, récupérer ses propriétés
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
          console.log(
            `URI trouvée pour l'image ${id}: ${embedId}, dimensions: ${width}x${height}`
          );
        } else {
          console.warn(`Type d'objet non reconnu pour ${id}`, embeddedObject);
        }
      }
      // Vérifier si c'est un richLink
      else if (allRichLinks[id]) {
        const richLink = allRichLinks[id];
        console.log(`Analyse du richLink ${id}:`, richLink);

        // Extraire l'URL et les métadonnées du richLink
        let uri = richLink.uri;
        let title = richLink.title || "Lien vers fichier";
        let description = richLink.description || "";
        let mimeType = null;

        // Vérifier aussi dans richLinkProperties (c'est la structure habituelle)
        if (richLink.richLinkProperties) {
          uri = uri || richLink.richLinkProperties.uri;
          title = richLink.richLinkProperties.title || title;
          mimeType = richLink.richLinkProperties.mimeType || null;
        }

        // Déterminer le type de fichier pour l'icône en fonction du MIME Type ou de l'URL
        let fileType = "document";
        let fileTypeSource = "default";

        // Si nous avons un mimeType, l'utiliser en priorité
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
        // Si pas de mimeType ou si c'est resté à "document" par défaut, essayer avec l'URI
        else if (uri) {
          fileTypeSource = "uri";
          // Extensions d'images courantes
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
          // Extensions vidéo courantes
          const videoExtensions = [
            ".mp4",
            ".webm",
            ".avi",
            ".mov",
            ".wmv",
            ".flv",
            ".mkv",
          ];

          // Vérifier si l'URL correspond à un service Google
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
            // Vérifier les extensions de fichiers
            const lowerUrl = uri.toLowerCase();

            // Vérifier si c'est une image
            if (imageExtensions.some((ext) => lowerUrl.endsWith(ext))) {
              fileType = "image";
            }
            // Vérifier si c'est une vidéo
            else if (videoExtensions.some((ext) => lowerUrl.endsWith(ext))) {
              fileType = "video";
            }

            // Vérifier aussi dans le titre si c'est une image/vidéo
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

        console.log(
          `Detection RichLink: ID=${id}, URL=${uri}, MIME=${mimeType}, détecté comme type=${fileType} (source: ${fileTypeSource})`
        );

        objectsData[id] = {
          type: "driveFile",
          url: uri,
          title: title,
          description: description,
          fileType: fileType,
          mimeType: mimeType,
          fileTypeSource: fileTypeSource,
        };
        console.log(
          `RichLink traité: ${id}, URL: ${uri}, Title: ${title}, Type: ${fileType}`
        );
      } else {
        console.warn(
          `Objet ${id} non trouvé dans les inlineObjects ni dans les richLinks`
        );
      }
    }

    console.log(
      `Données récupérées pour ${Object.keys(objectsData).length} sur ${
        inlineObjectIds.length
      } objets`
    );
    return objectsData;
  } catch (error) {
    console.error("Error fetching inline objects:", error);
    return {};
  }
}

function generateSiteHtml(docTitle, tabsData, objectData) {
  // Créer une copie de objectData sans les données base64 pour le script
  const scriptObjectData = {};
  for (const [key, value] of Object.entries(objectData)) {
    scriptObjectData[key] = { ...value };

    // Supprimer les données base64 volumineuses du script
    if (scriptObjectData[key].type === "image") {
      // Conserver uniquement les métadonnées, pas le contenu base64
      delete scriptObjectData[key].base64;

      // Ajouter le chemin local de l'image pour le script
      const mimeType = value.base64
        ? value.base64.split(";")[0].split(":")[1]
        : "image/png";
      const extension = mimeType.split("/")[1] || "png";
      scriptObjectData[key].localSrc = `images/${key}.${extension}`;
    }
  }

  // Convertir les données d'objets inline (sans base64) en chaîne JSON pour le script
  const imageDataString = JSON.stringify(scriptObjectData);

  // Remplacer les chemins d'image dans le HTML
  let processedTabsData = JSON.parse(JSON.stringify(tabsData)); // Clone profond
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
    
    // Configuration du menu responsive
    const sidebar = document.querySelector('.sidebar');
    const menuButton = document.querySelector('.menu-toggle');
    
    // Gérer l'affichage du menu sur mobile
    menuButton.addEventListener('click', function() {
      sidebar.classList.toggle('expanded');
      this.innerHTML = sidebar.classList.contains('expanded') ? '✕ Fermer' : '☰ Menu';
    });
    
    // Cacher tous les onglets sauf le premier
    const tabContents = document.querySelectorAll('.tab-content');
    tabContents.forEach(tab => {
      tab.style.display = "none";
    });
    
    // Afficher le premier onglet par défaut
    const firstTab = document.querySelector('.tab-content');
    const firstLink = document.querySelector('.nav-link');
    if (firstTab) {
      firstTab.style.display = "block";
      firstTab.classList.add('active');
    }
    if (firstLink) firstLink.classList.add('active');
    
    // Fonction pour remplacer tous les objets inline
    const replaceInlineObjects = (container) => {
      // Remplacer les objets inline
      container.querySelectorAll('span.inline-object').forEach(obj => {
        const objectId = obj.getAttribute('data-object-id');
        if (!objectId || !objectData[objectId]) {
          obj.textContent = '[Objet non disponible]';
          return;
        }
        
        const data = objectData[objectId];
        
        if (data.type === 'driveFile') {
          // Créer un élément de lien Drive
          const link = document.createElement('a');
          link.href = data.url;
          link.target = '_blank';
          link.rel = 'noopener noreferrer';
          link.className = 'drive-file-link';
          
          // Déterminer l'icône selon le type de fichier
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
          
          // Remplacer le placeholder par le lien
          obj.parentNode.replaceChild(link, obj);
          console.log('Lien Drive remplacé pour objectId:', objectId);
        }
      });
    };
    
    // Fonction pour générer automatiquement les tables des matières
    const generateTableOfContents = () => {
      const activeTab = document.querySelector('.tab-content.active');
      const tocPlaceholders = activeTab ? activeTab.querySelectorAll('.toc-placeholder[data-auto-generated="true"]') : [];
      
      if (tocPlaceholders.length === 0) return;
      
      // Trouver tous les titres dans l'onglet actif
      const headings = activeTab.querySelectorAll('h1[id]:not(.tab_title), h2[id], h3[id], h4[id], h5[id], h6[id]');
      
      if (headings.length === 0) return;
      
      // Générer le HTML de la table des matières
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
          
          // Mettre en évidence temporairement le titre cible
          const originalBg = heading.style.backgroundColor;
          heading.style.backgroundColor = '#ffff99';
          setTimeout(() => {
            heading.style.backgroundColor = originalBg;
          }, 2000);
        });
        
        item.appendChild(link);
        tocHtml.appendChild(item);
      });
      
      // Remplir les placeholders
      tocPlaceholders.forEach(placeholder => {
        placeholder.innerHTML = '';
        placeholder.appendChild(tocHtml.cloneNode(true));
      });
    };
    
    // Remplacer les objets dans l'onglet actif initial
    replaceInlineObjects(firstTab);
    
    // Générer les tables des matières
    generateTableOfContents();
    
    // Ajouter des écouteurs d'événements à tous les liens de navigation
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
      link.addEventListener('click', function(e) {
        e.preventDefault();
        
        // Supprimer la classe active de tous les liens et contenus
        navLinks.forEach(l => l.classList.remove('active'));
        tabContents.forEach(tab => {
          tab.classList.remove('active');
          tab.style.display = "none";
        });
        
        // Ajouter la classe active au lien et contenu cliqués
        this.classList.add('active');
        const targetId = this.getAttribute('href').substring(1);
        const targetTab = document.getElementById(targetId);
        if (targetTab) {
          targetTab.classList.add('active');
          targetTab.style.display = "block";
          
          // Remplacer les objets dans l'onglet nouvellement affiché
          replaceInlineObjects(targetTab);
          
          // Générer les tables des matières pour le nouvel onglet
          setTimeout(() => {
            generateTableOfContents();
          }, 100);
        }
        
        // Fermer le menu sur mobile après sélection d'un onglet
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
// Fonction pour générer le menu de navigation avec une structure récursive
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

// Fonction pour récupérer les images existantes
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
      console.warn("Impossible de récupérer la liste des images existantes");
      return {};
    }
    const data = await response.json();
    return data.success ? data.images : {};
  } catch (error) {
    console.warn(
      "Erreur lors de la récupération des images existantes:",
      error
    );
    return {};
  }
}

// Fonction pour générer le contenu des onglets
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

//  fonction pour prétraiter le contenu des onglets et adapter les liens d'images

function processTabsContent(tabsData, objectData, folderName = "") {
  for (const tab of tabsData) {
    // Traiter le contenu HTML pour ajuster les chemins d'images
    if (tab.content) {
      tab.content = tab.content.replace(
        /<span id="([^"]+)" class="inline-object" data-object-id="([^"]+)">\[Objet en cours de chargement\.\.\.\]<\/span>/g,
        (match, id, objectId) => {
          const obj = objectData[objectId];
          if (!obj) return match;

          if (obj.type === "image") {
            // Déterminer l'extension à partir du type MIME ou utiliser .png par défaut
            const mimeType = obj.base64
              ? obj.base64.split(";")[0].split(":")[1]
              : "image/png";
            const extension = mimeType.split("/")[1] || "png";

            // Ajouter les attributs de largeur et hauteur si disponibles
            const widthAttr = obj.width ? ` width="${obj.width}"` : "";
            const heightAttr = obj.height ? ` height="${obj.height}"` : "";

            // Si une rotation est spécifiée, ajouter un style CSS
            const rotationStyle = obj.rotation
              ? ` style="transform: rotate(${obj.rotation}rad);"`
              : "";

            // Utiliser le chemin relatif correct pour les images
            const imagePath = "images";

            return `<img src="${imagePath}/${objectId}.${extension}" alt="Image" class="inline-image" id="${id}" data-object-id="${objectId}"${widthAttr}${heightAttr}${rotationStyle}>`;
          } else if (obj.type === "driveFile") {
            // Garder le contenu tel quel pour les fichiers Drive
            return match;
          }
          return match;
        }
      );
    }

    // Traiter récursivement les sous-onglets
    if (tab.childTabs && tab.childTabs.length > 0) {
      tab.childTabs = processTabsContent(tab.childTabs, objectData, folderName);
    }
  }

  return tabsData;
}
async function saveGeneratedSite(htmlContent, imagesData, docTitle) {
  try {
    // Générer un nom de dossier sanitisé basé uniquement sur le titre du document
    const sanitizedTitle = docTitle
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "") // Supprimer tous les caractères spéciaux
      .replace(/\s+/g, "-") // Remplacer les espaces par des tirets
      .replace(/-+/g, "-") // Éviter les tirets multiples
      .trim();

    // Utiliser uniquement le titre sanitisé comme nom de dossier
    const folderName = sanitizedTitle;

    // Créer le dossier de sortie principal et les sous-dossiers (ou réutiliser s'il existe)
    const createFoldersResponse = await fetch("create_folders.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        mainFolder: folderName, // Passer le nom du dossier unique au script PHP
      }),
    });

    if (!createFoldersResponse.ok) {
      throw new Error(
        `Erreur lors de la création des dossiers: ${createFoldersResponse.status}`
      );
    }

    const folderInfo = await createFoldersResponse.json();
    console.log("Information sur le dossier:", folderInfo);

    // Sauvegarder le fichier HTML principal dans le dossier unique
    const filename = `${folderName}/index.html`;

    console.log(
      "Sauvegarde du HTML, longueur:",
      htmlContent ? htmlContent.length : 0
    );

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
      throw new Error(
        `Erreur lors de la sauvegarde du fichier HTML: ${saveHtmlResponse.status}`
      );
    }

    const saveHtmlResponseData = await saveHtmlResponse.json();
    console.log(
      "Réponse du serveur après sauvegarde HTML:",
      saveHtmlResponseData
    );

    // Traiter et sauvegarder chaque image dans le sous-dossier d'images
    const savedImages = {};

    for (const [objectId, imageData] of Object.entries(imagesData)) {
      if (imageData.type === "image") {
        try {
          // Si l'image a un chemin local, elle existe déjà et n'a pas besoin d'être sauvegardée
          if (imageData.skipProcessing && imageData.localFilePath) {
            console.log(
              `Image ${objectId} déjà existante, réutilisation: ${imageData.localFilePath}`
            );
            savedImages[objectId] = imageData.localFilePath;
            continue;
          }

          // Sinon, sauvegarder l'image si elle a des données base64
          if (imageData.base64) {
            // Extraire l'extension à partir du type MIME ou utiliser .png par défaut
            const mimeType =
              imageData.base64.split(";")[0].split(":")[1] || "image/png";
            const extension = mimeType.split("/")[1] || "png";

            // Chemin relatif au dossier unique
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
                `Erreur HTTP ${response.status}: ${await response.text()}`
              );
            }

            const data = await response.json();
            if (!data.success) {
              throw new Error(
                `Échec de sauvegarde: ${data.message || "Erreur inconnue"}`
              );
            }

            // Enregistrer le chemin local de l'image pour mise à jour HTML
            savedImages[objectId] = data.path;
            console.log(
              `Image ${objectId} sauvegardée avec succès à ${data.path}`
            );
          }
        } catch (imageError) {
          console.error(
            `Erreur lors du traitement de l'image ${objectId}:`,
            imageError
          );
          // Continuer avec les autres images même si une échoue
        }
      }
    }

    // Obtenir l'URL de base pour accéder au site généré
    const baseUrlResponse = await fetch("get_base_url.php");
    if (!baseUrlResponse.ok) {
      throw new Error(
        `Erreur lors de l'obtention de l'URL de base: ${baseUrlResponse.status}`
      );
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
    console.error("Erreur lors de la sauvegarde du site:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}
async function displayGeneratedSite(htmlContent, imageData, docTitle) {
  try {
    // Afficher un message de chargement
    const resultContainer =
      document.getElementById("parse-result") || document.body;
    resultContainer.innerHTML = `
      <div style="text-align: center; padding: 20px;">
        <p>Génération du site en cours...</p>
        <div class="spinner" style="border: 4px solid #f3f3f3; border-top: 4px solid #3498db; border-radius: 50%; width: 30px; height: 30px; animation: spin 1s linear infinite; margin: 0 auto;"></div>
      </div>
      <style>@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }</style>
    `;

    // Sauvegarder le site et les images
    const result = await saveGeneratedSite(htmlContent, imageData, docTitle);

    if (result.success) {
      // Créer l'interface utilisateur pour accéder au site généré
      const downloadContainer = document.createElement("div");
      downloadContainer.style.marginTop = "20px";
      downloadContainer.style.padding = "15px";
      downloadContainer.style.border = "1px solid #ccc";
      downloadContainer.style.backgroundColor = "#f9f9f9";
      downloadContainer.style.borderRadius = "5px";

      const downloadHeading = document.createElement("h3");
      downloadHeading.textContent = "Site généré avec succès !";
      downloadHeading.style.color = "#34a853";

      const siteLink = document.createElement("a");
      siteLink.href = result.url;
      siteLink.target = "_blank";
      siteLink.className = "site-link";
      siteLink.textContent = "Voir le site généré";
      siteLink.style.display = "inline-block";
      siteLink.style.padding = "10px 15px";
      siteLink.style.backgroundColor = "#4285f4";
      siteLink.style.color = "white";
      siteLink.style.borderRadius = "4px";
      siteLink.style.textDecoration = "none";
      siteLink.style.margin = "10px 0";

      const pathInfo = document.createElement("div");
      pathInfo.style.marginTop = "15px";
      pathInfo.style.backgroundColor = "#e8f0fe";
      pathInfo.style.padding = "10px";
      pathInfo.style.borderRadius = "4px";
      pathInfo.style.border = "1px solid #4285f4";

      pathInfo.innerHTML = `
        <p><strong>Informations :</strong></p>
        <ul>
          <li>Le site a été généré dans le dossier <code>output/${
            result.folder
          }/</code></li>
          <li>Fichier HTML principal : <code>output/${
            result.folder
          }/index.html</code></li>
          <li>Images : <code>output/${result.folder}/images/</code></li>
          <li>${
            result.folderExisted
              ? "Le dossier existait déjà, son contenu a été mis à jour."
              : "Un nouveau dossier a été créé pour ce document."
          }</li>
          <li>Vous pouvez copier tout le contenu du dossier <code>output/${
            result.folder
          }</code> pour l'héberger ailleurs</li>
        </ul>
      `;

      downloadContainer.appendChild(downloadHeading);
      downloadContainer.appendChild(siteLink);
      downloadContainer.appendChild(pathInfo);

      resultContainer.innerHTML = "";
      resultContainer.appendChild(downloadContainer);

      // Ouvrir le site dans un nouvel onglet
      window.open(result.url, "_blank");
    } else {
      // Afficher un message d'erreur
      resultContainer.innerHTML = `
        <div style="padding: 20px; color: #721c24; background-color: #f8d7da; border: 1px solid #f5c6cb; border-radius: 5px;">
          <h3>Erreur lors de la génération du site</h3>
          <p>${result.error}</p>
          <p>Veuillez vérifier les permissions d'écriture dans le dossier "output" de votre serveur.</p>
        </div>
      `;
    }
  } catch (error) {
    console.error("Error displaying generated site:", error);
    const resultContainer =
      document.getElementById("parse-result") || document.body;
    resultContainer.innerHTML = `
      <div style="padding: 20px; color: #721c24; background-color: #f8d7da; border: 1px solid #f5c6cb; border-radius: 5px;">
        <h3>Erreur inattendue</h3>
        <p>${error.message}</p>
      </div>
    `;
  }
}
async function convertImageToBase64(url) {
  try {
    console.log("Converting image to base64:", url);

    // Vérifier si l'URL est déjà en base64
    if (url.startsWith("data:image")) {
      console.log("URL is already in base64 format, returning as is");
      return url;
    }

    const proxyUrl = `proxy_googlecontent.php?url=${encodeURIComponent(url)}`;
    console.log("Fetching image via proxy:", proxyUrl);

    const response = await fetch(proxyUrl);
    if (!response.ok) {
      console.error(
        "Failed to fetch image from proxy:",
        response.status,
        response.statusText
      );
      return null;
    }

    // Vérifier le type de contenu pour confirmer que c'est bien une image
    const contentType = response.headers.get("content-type");
    if (contentType && !contentType.startsWith("image/")) {
      console.warn(
        `Le contenu n'est pas une image (${contentType}). URL: ${url}`
      );
    }

    const blob = await response.blob();
    console.log("Image fetched, size:", Math.round(blob.size / 1024), "KB");

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        console.log(
          "Image converted to base64 successfully, format:",
          reader.result.substring(0, 30) + "..."
        );
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

  // Ne supprimer que les caractères problématiques spécifiques
  return text
    .replace(/\u000B/g, "") // Vertical Tab
    .replace(/\u000C/g, "") // Form Feed
    .replace(/[\u0000-\u0008\u000E-\u001F\u007F-\u009F]/g, ""); // Autres caractères de contrôle
}
