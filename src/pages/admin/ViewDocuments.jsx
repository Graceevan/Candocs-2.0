import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import "../../styles/ViewDocuments.css";
import api from "../../api/axiosInstance";
import alertService from "../../services/alertService";
import { Pagination } from "antd";
import { EyeOutlined, EditOutlined, SaveOutlined } from "@ant-design/icons";
import { CloseCircleOutlined } from "@ant-design/icons";
import { Button } from "antd";
import { useNavigate } from "react-router-dom";
import { Typography } from "antd";
import { Spin, Space } from "antd";
import mammoth from "mammoth";
import * as XLSX from "xlsx";
import JSZip from "jszip";
const ViewDocuments = () => {
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalElements, setTotalElements] = useState(0);
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [isFilterVisible, setIsFilterVisible] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedDetails, setEditedDetails] = useState({});

  const [filters, setFilters] = useState([
    { field: "storageAreaId", values: [""], operatorToNext: "AND" },
  ]);
  const { Title } = Typography;
  const authState = useSelector((state) => state.auth.user);
  const authToken =
    useSelector((state) => state.auth.user?.authToken) ||
    localStorage.getItem("authToken");
  const userId = authState?.userId;
  const [previewLoading, setPreviewLoading] = useState(false);
  const [docxHtml, setDocxHtml] = useState(null);

  const pptxToImages = async (base64Pptx) => {
    const byteArray = Uint8Array.from(atob(base64Pptx), (c) => c.charCodeAt(0));
    const zip = await JSZip.loadAsync(byteArray);

    const slideImages = [];

    // Loop through slide images in ppt/media
    for (const filename of Object.keys(zip.files)) {
      if (filename.startsWith("ppt/media/")) {
        const file = zip.files[filename];
        const blob = await file.async("blob");
        const url = URL.createObjectURL(blob);
        slideImages.push(url);
      }
    }

    return slideImages; // array of slide image URLs
  };
  const filterOptions = [
    { value: "storageAreaId", label: "Storage Area Id" },
    { value: "documentName", label: "Document Name" },
    { value: "documentTitle", label: "Document Title" },
    { value: "mimeType", label: "Mime Type" },
    { value: "defaultSharedLocation", label: "Default Shared Location" },
    { value: "version", label: "Version" },
  ];

  const fetchDocuments = async (
    currentFilters,
    currentSearchQuery,
    currentPage,
    currentSize = pageSize
  ) => {
    if (!authToken || !userId) {
      alertService.error("Authentication Error", "User is not logged in.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        fieldValueList:
          currentFilters.length > 0 &&
          currentFilters[0].values.some((val) => val.trim() !== "")
            ? currentFilters.map((f) => ({
                field: f.field,
                values: f.values.filter((val) => val.trim() !== ""),
                operatorToNext: f.operatorToNext,
              }))
            : null,
        content: currentSearchQuery || null,
      };

      if (
        payload.fieldValueList &&
        payload.fieldValueList.every((f) => f.values.length === 0)
      ) {
        payload.fieldValueList = null;
      }

      const { data } = await api.post(
        `/candocspro/get-all-documents?page=${
          currentPage - 1
        }&size=${currentSize}&userId=${userId}`,
        payload,
        { headers: { Authorization: `Bearer ${authToken}` } }
      );

      if (data && data.documents) {
        const mappedDocs = data.documents.map((doc) => ({
          guid: doc.guid?.[0] || "",
          name: doc.documentName?.[0] || "",
          title: doc.documentTitle?.[0] || "",
          mime: doc.mimeType?.[0] || "",
          location: doc.defaultSharedLocation?.[0] || "",
          version: doc.version?.[0] || "",
          storageId: doc.storageAreaId?.[0] || "",
          fileName: doc.documentName?.[0] || "",
          updatedAt: doc.documentUpdatedAt?.[0] || "",
          preview: "",
          status: "PENDING",
        }));

        setDocuments(mappedDocs);
        setTotalElements(data.totalElements ?? 0);
        setPage(currentPage);
        setPageSize(currentSize);
      } else {
        setDocuments([]);
        setTotalElements(0);
        alertService.info("No Data", "No documents found.");
      }
    } catch (error) {
      const message =
        error.response?.data?.message ||
        "Failed to fetch documents from server.";
      alertService.error("Error", message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    return () => {
      if (selectedDoc?.preview) {
        URL.revokeObjectURL(selectedDoc.preview);
      }
    };
  }, [selectedDoc]);

  useEffect(() => {
    fetchDocuments(filters, searchQuery, page, pageSize);
  }, [authToken, userId]);

  const fetchFile = async (doc) => {
    // Open the modal immediately with empty preview
    setSelectedDoc({
      guid: doc.guid,
      mime: doc.mime,
      storageId: doc.storageId,
      preview: null,
      document: null,
      customData: null,
    });

    setPreviewLoading(true);

    try {
      // Revoke previous preview (avoid showing old blob)
      if (selectedDoc?.preview) {
        URL.revokeObjectURL(selectedDoc.preview);
      }

      // Force cache bypass
      const { data } = await api.post(
        `/candocspro/get-file?storageAreaId=${doc.storageId}&guid=${
          doc.guid
        }&_=${Date.now()}`,
        {},
        { headers: { "Cache-Control": "no-cache" } }
      );

      let previewUrl = "";
      let finalMimeType =
        data.mimeType || doc.mime || "application/octet-stream";
      const isWordDoc = finalMimeType
        .toLowerCase()
        .includes("wordprocessingml.document");
      // ADD THIS LINE for Excel files
      const isExcelDoc = finalMimeType
        .toLowerCase()
        .includes("spreadsheetml.sheet");
      const isPowerPointDoc =
        finalMimeType.toLowerCase().includes("pptx") || // .pptx (modern PowerPoint)
        finalMimeType.toLowerCase().includes("ppt"); // .ppt (legacy PowerPoint)

      if (data.fileData) {
        // NOTE: The base64 data must be used to create a Blob URL for download or PDF/image viewing.
        const byteArray = Uint8Array.from(atob(data.fileData), (c) =>
          c.charCodeAt(0)
        );
        // --- START CRITICAL CHANGE 1: Force blob creation for all non-text/complex files ---
        // Create the Blob URL immediately if it's an image, PDF, video, audio, or unknown/binary file.
        // This ensures PNG always gets a preview URL.
        if (!isWordDoc && !isExcelDoc && !isPowerPointDoc) {
          const blob = new Blob([byteArray], { type: finalMimeType });
          previewUrl = URL.createObjectURL(blob);
        }

        // --- END CRITICAL CHANGE 1 ---

        if (isPowerPointDoc) {
          try {
            const slideImages = await pptxToImages(data.fileData);
            if (slideImages.length > 0) {
              const slidesHtml = slideImages
                .map(
                  (url, idx) =>
                    `<div style="margin-bottom: 20px; text-align:center">
            <img src="${url}" alt="Slide ${idx + 1}" 
              style="width:100%;border:1px solid #ddd;border-radius:6px;box-shadow:0 2px 6px rgba(0,0,0,0.1)"/>
            <p style="color:#666">Slide ${idx + 1}</p>
          </div>`
                )
                .join("");
              setDocxHtml(`<div class="vd-ppt-preview">${slidesHtml}</div>`);
            } else {
              // ✅ always fallback so preview section renders something
              setDocxHtml(`
        <div style="padding:20px;text-align:center;color:#999">
          ⚠️ Unable to generate slide previews.
          <br/>
          <a href="${previewUrl}" download>Download PPTX</a> to view the file.
        </div>`);
            }
          } catch (err) {
            console.error("PPTX conversion failed:", err);
            setDocxHtml(`<p>Failed to load PowerPoint preview. 
      <a href="${previewUrl}" download>Download file</a>.</p>`);
          }
        }

        // Special handling for DOCX/XLSX: They cannot be previewed directly in a browser iframe.
        // We can still create a blob URL for download, but we won't use it in an iframe.
        if (isWordDoc) {
          // Convert DOCX to HTML for simple preview
          const arrayBuffer = byteArray.buffer;
          mammoth
            .convertToHtml({ arrayBuffer: arrayBuffer })
            .then((result) => {
              setDocxHtml(result.value);
            })
            .catch((error) => {
              console.error("Mammoth conversion failed:", error);
              setDocxHtml(
                `<p class="vd-doc-unsupported">Failed to convert Word document for preview. <a href="${previewUrl}" download>Download file</a>.</p>`
              );
            });
        }
        // Inside fetchFile, under the isExcelDoc check:
        else if (isExcelDoc) {
          try {
            const arrayBuffer = byteArray.buffer;
            const workbook = XLSX.read(arrayBuffer, { type: "array" });
            const firstSheetName = workbook.SheetNames[0];
            let htmlTable = XLSX.utils.sheet_to_html(
              workbook.Sheets[firstSheetName]
            );

            // Wrap table in a container to scope styles
            const excelStyles = `
                    <style>
                        .excel-preview-wrapper table { border-collapse: collapse; width: 100%; }
                        .excel-preview-wrapper td, 
                        .excel-preview-wrapper th { border: 1px solid #ccc; padding: 4px; text-align: left; }
                        .excel-preview-wrapper th { background: #f9f9f9; }
                    </style>
                    <div class="excel-preview-wrapper">${htmlTable}</div>
                `;

            setDocxHtml(excelStyles);
          } catch (error) {
            console.error("SheetJS conversion failed:", error);
            setDocxHtml(`<p class="vd-doc-unsupported">
                    Failed to convert Excel document for preview. 
                    <a href="${previewUrl}" download>Download file</a>.
                </p>`);
          }
        } else {
          setDocxHtml(null); // Clear HTML for other document types
        }
      }

      // Update selectedDoc with preview
      setSelectedDoc((prev) => ({
        ...prev,
        preview: previewUrl, // This will be the Blob URL or empty for docx
        document: data.document,
        customData: data.customData,
        fileData: data.fileData,
        createdAt: data.createdAt,
      }));
    } catch (error) {
      alertService.error(
        "Error",
        error.response?.data?.message || "Failed to load document file."
      );
    } finally {
      setPreviewLoading(false);
    }
  };
  const updateDocument = async (guid) => {
    try {
      setPreviewLoading(true);

      const formData = new FormData();
      formData.append(
        "storageAreaId",
        editedDetails.storageAreaId || selectedDoc.storageId || "DB_CHENNAI"
      );
      formData.append(
        "className",
        editedDetails.customClassName ||
          selectedDoc.document?.customClassName ||
          "testing.Stephen701"
      );
      formData.append("guid", guid);

      // Document section
      const documentPayload = {
        documentTitle:
          editedDetails.documentTitle || selectedDoc.document?.documentTitle,
        version: editedDetails.version || selectedDoc.document?.version,
        mimeType: editedDetails.mimeType || selectedDoc.document?.mimeType,
        defaultSharedLocation:
          editedDetails.defaultSharedLocation ||
          selectedDoc.document?.defaultSharedLocation,
      };
      formData.append(
        "document",
        new Blob([JSON.stringify(documentPayload)], {
          type: "application/json",
        })
      );

      // Custom data section
      const customDataPayload =
        editedDetails.customData &&
        Object.keys(editedDetails.customData).length > 0
          ? editedDetails.customData
          : selectedDoc.customData || {};

      formData.append(
        "customData",
        new Blob([JSON.stringify(customDataPayload)], {
          type: "application/json",
        })
      );

      // Replace file if new one provided
      if (editedDetails.file) {
        formData.append("file", editedDetails.file);
      }

      const { data } = await api.post(`/candocspro/update-file`, formData, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "multipart/form-data",
        },
      });

      alertService.success(
        "Success",
        data.message || "Document updated successfully!"
      );

      // ✅ Refresh the list (doesn’t affect current preview)
      await fetchDocuments(filters, searchQuery, page, pageSize);

      // ✅ Force a fresh file fetch immediately, using known identifiers
      await fetchFile({
        guid,
        storageId: selectedDoc.storageId,
        mime: selectedDoc.mime,
      });

      setIsEditing(false);
    } catch (error) {
      console.error("Update failed:", error);
      alertService.error(
        "Error",
        error.response?.data?.message || "Failed to update document."
      );
    } finally {
      setPreviewLoading(false);
    }
  };

  const addFilter = () => {
    setFilters([
      ...filters,
      { field: "storageAreaId", values: [""], operatorToNext: "AND" },
    ]);
  };

  const removeFilter = (index) => {
    if (filters.length <= 1) return;
    const newFilters = [...filters];
    newFilters.splice(index, 1);
    setFilters(newFilters);
  };

  const addValueField = (filterIndex) => {
    const newFilters = [...filters];
    newFilters[filterIndex].values = [...newFilters[filterIndex].values, ""];
    setFilters(newFilters);
  };

  const removeValueField = (filterIndex, valueIndex) => {
    const newFilters = [...filters];
    newFilters[filterIndex].values.splice(valueIndex, 1);
    if (newFilters[filterIndex].values.length === 0) {
      newFilters[filterIndex].values.push("");
    }
    setFilters(newFilters);
  };

  const updateFilterField = (index, field) => {
    const newFilters = [...filters];
    newFilters[index].field = field;
    newFilters[index].values = [""];
    setFilters(newFilters);
  };

  const updateFilterValues = (index, values) => {
    const newFilters = [...filters];
    newFilters[index].values = values;
    setFilters(newFilters);
  };

  const updateFilterOperator = (index, operator) => {
    const newFilters = [...filters];
    newFilters[index].operatorToNext = operator;
    setFilters(newFilters);
  };

  const applyFilters = () => {
    setPage(1);
    fetchDocuments(filters, searchQuery, 1);
  };

  const clearFilters = () => {
    setFilters([
      { field: "storageAreaId", values: [""], operatorToNext: "AND" },
    ]);
    setSearchQuery("");
    setPage(1);
    fetchDocuments([], "", 1);
  };

  const toggleFilterVisibility = () => {
    setIsFilterVisible(!isFilterVisible);
  };

  return (
    <div className="vd-document-list-container">
      <header className="vd-header">
        <Title className="view-page-title" level={2}>
          Documents List
        </Title>
        <div className="vd-header-actions">
          <button
            className="vd-btn vd-btn-primary"
            onClick={() => navigate("/admin/fileupload")}
          >
            <i className="fas fa-plus"></i> Upload Document
          </button>
        </div>
      </header>
      <div className="vd-card">
        <div className="vd-card-header">
          <div className="vd-card-title">View and manage all documents</div>
        </div>

        <div className="vd-filters-section">
          <div className="vd-filter-header">
            <div className="vd-filter-title">Filter Documents</div>
            <div className="vd-filter-controls">
              <button className="vd-btn vd-btn-outline" onClick={applyFilters}>
                Apply Filters
              </button>
              <button className="vd-btn vd-btn-outline" onClick={clearFilters}>
                Clear All
              </button>
              <button
                className="vd-btn vd-btn-outline"
                onClick={toggleFilterVisibility}
              >
                {isFilterVisible ? "Hide Filters" : "Show Filters"}
              </button>
            </div>
          </div>
          {isFilterVisible && (
            <div className="vd-filters-container">
              {filters.map((filter, index) => (
                <div key={index} className="vd-filter-group">
                  <div className="vd-filter-row">
                    <div className="vd-filter-field">
                      <div className="vd-form-group">
                        <label>Field</label>
                        <select
                          className="vd-form-select"
                          value={filter.field}
                          onChange={(e) =>
                            updateFilterField(index, e.target.value)
                          }
                        >
                          {filterOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="vd-filter-values">
                      <div className="vd-form-group">
                        <label>Values</label>
                        <div className="vd-value-list">
                          {filter.values.map((value, i) => (
                            <div key={i} className="vd-value-row">
                              <input
                                type="text"
                                className="vd-form-input"
                                value={value}
                                placeholder="Enter value"
                                onChange={(e) => {
                                  const newValues = [...filter.values];
                                  newValues[i] = e.target.value;
                                  updateFilterValues(index, newValues);
                                }}
                              />
                              <div className="vd-value-actions">
                                <button
                                  className="vd-btn vd-btn-primary vd-add-btn"
                                  title="Add new value"
                                  onClick={() => addValueField(index)}
                                >
                                  +
                                </button>
                                {filter.values.length > 1 && (
                                  <button
                                    className="vd-btn vd-btn-outline vd-remove-btn"
                                    title="Remove value"
                                    onClick={() => removeValueField(index, i)}
                                  >
                                    -
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="vd-filter-operator">
                      <div className="vd-form-group">
                        <label>Operator</label>
                        <select
                          className="vd-form-select"
                          value={filter.operatorToNext}
                          disabled={
                            filters.length === 1 || index === filters.length - 1
                          }
                          onChange={(e) =>
                            updateFilterOperator(index, e.target.value)
                          }
                        >
                          <option value="AND">AND</option>
                          {filters.length > 1 && index < filters.length - 1 && (
                            <option value="OR">OR</option>
                          )}
                        </select>
                      </div>
                    </div>

                    <div className="vd-filter-actions">
                      <button
                        className="vd-btn vd-btn-primary"
                        title="Add condition"
                        onClick={addFilter}
                      >
                        +
                      </button>
                      {filters.length > 1 && (
                        <button
                          className="vd-btn vd-btn-outline"
                          title="Remove condition"
                          onClick={() => removeFilter(index)}
                        >
                          -
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              <div className="vd-search-box">
                <i className="fas fa-search"></i>
                <input
                  type="text"
                  placeholder="Search Content..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      applyFilters();
                    }
                  }}
                />
              </div>
            </div>
          )}
        </div>

        <Spin spinning={loading} tip="">
          <div className="vd-table-container">
            <table>
              <thead>
                <tr>
                  <th>Document Name</th>
                  <th>Document Title</th>
                  <th>Mime Type</th>
                  {/* <th>Default Shared Location</th> */}
                  <th>Version</th>
                  <th>Storage Area Id</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {documents.length > 0 ? (
                  documents.map((doc, index) => (
                    <tr key={`${doc.guid}-${index}`}>
                      <td>{doc.name}</td>
                      <td>{doc.title}</td>
                      <td>{doc.mime}</td>
                      {/* <td><span className="vd-badge vd-badge-primary">{doc.location}</span></td> */}
                      <td>{doc.version}</td>
                      <td>
                        <span
                          className={`vd-badge ${
                            doc.storageId.includes("S3")
                              ? "vd-badge-success"
                              : "vd-badge-primary"
                          }`}
                        >
                          {doc.storageId}
                        </span>
                      </td>
                      <td className="vd-actions">
                        <Button
                          type="link"
                          title="View"
                          onClick={() => fetchFile(doc)}
                          icon={<EyeOutlined />}
                          className="vd-custom-view-btn"
                        >
                          View
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="vd-no-documents-found">
                      No documents found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            {documents.length > 0 && (
              <Pagination
                current={page}
                total={totalElements}
                pageSize={pageSize}
                onChange={(newPage, newSize) => {
                  setPage(newPage);
                  setPageSize(newSize);
                  fetchDocuments(filters, searchQuery, newPage, newSize);
                }}
                showSizeChanger={true}
                pageSizeOptions={["10", "20", "50", "100"]}
                style={{ marginTop: 20, float: "right" }}
              />
            )}
          </div>
        </Spin>
      </div>
      {selectedDoc && (
        <div className="vd-modal-overlay">
          <div className="vd-modal-content">
            <div className="vd-modal-header">
              <div className="vd-modal-header-left">
                <h3>
                  <span>Guid - {selectedDoc.guid}</span>
                </h3>

                <div className="vd-modal-header-actions">
                  <Button
                    type="primary"
                    icon={
                      isEditing ? <CloseCircleOutlined /> : <EditOutlined />
                    }
                    onClick={() => {
                      if (isEditing) {
                        // Cancel editing
                        setIsEditing(false);
                        setEditedDetails({});
                      } else {
                        // Enable editing
                        setIsEditing(true);
                        setEditedDetails({
                          documentTitle:
                            selectedDoc.document?.documentTitle || "",
                          version: selectedDoc.document?.version || "",
                          mimeType:
                            selectedDoc.document?.mimeType ||
                            selectedDoc.mime ||
                            "",
                          customClassName:
                            selectedDoc.document?.customClassName || "",
                        });
                      }
                    }}
                    style={{
                      backgroundColor: isEditing ? "#f5222d" : "#1890ff", // red for cancel, blue for edit
                      borderColor: isEditing ? "#f5222d" : "#1890ff",
                    }}
                  >
                    {isEditing ? "Cancel" : "Edit"}
                  </Button>
                </div>

                {/* Move close button to separate container */}
                <div className="vd-modal-header-right">
                  <Button
                    type="text"
                    icon={<CloseCircleOutlined />}
                    onClick={() => {
                      // Reset editing state when modal is closed
                      setIsEditing(false);
                      setEditedDetails({});
                      setSelectedDoc(null);
                    }}
                    style={{
                      fontSize: "20px",
                      color: "#595959",
                    }}
                  />
                </div>
              </div>
            </div>

            {/* ✅ Moved Save button below header */}
            {isEditing && (
              <div className="vd-save-section">
                <Button
                  type="primary"
                  icon={<SaveOutlined />}
                  onClick={() => updateDocument(selectedDoc.guid)}
                  className="vd-save-btn"
                >
                  Save
                </Button>
              </div>
            )}

            <div className="vd-modal-body">
              <div className="vd-preview-section">
                <Spin spinning={previewLoading} size="large" tip="">
                  {selectedDoc?.preview || docxHtml ? (
                    // ✅ PRIORITY 1: DOCX / XLSX / PPTX (converted HTML)
                    docxHtml ? (
                      <div
                        className="vd-doc-preview vd-html-view"
                        style={{
                          padding: "15px",
                          border: "1px solid #eee",
                          overflow: "auto",
                          maxHeight: "600px",
                        }}
                        dangerouslySetInnerHTML={{ __html: docxHtml }}
                      />
                    ) : // ✅ PDF
                    selectedDoc.mime?.toLowerCase().includes("pdf")? (
                      <iframe
                        src={selectedDoc.preview}
                        title="Document Preview"
                        className="vd-doc-preview"
                        style={{ width: "100%", height: "100%" }}
                      />
                    ) :// ✅ PowerPoint (.ppt / .pptx) Preview
(selectedDoc.mime?.toLowerCase().includes("ppt") ||
 selectedDoc.mime?.toLowerCase().includes("pptx")) &&
selectedDoc.fileData ? (
  <div
    className="vd-pptx-preview-wrapper"
    style={{
      maxHeight: "600px",
      overflow: "auto",
      border: "1px solid #ddd",
      borderRadius: "8px",
      padding: "30px",
      textAlign: "center",
      backgroundColor: "#fafafa",
    }}
  >
    {(() => {
      try {
        // Decode Base64 to blob URL for download/open
        const byteArray = Uint8Array.from(
          atob(selectedDoc.fileData),
          (c) => c.charCodeAt(0)
        );
        const blob = new Blob([byteArray], {
          type: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        });
        const blobUrl = URL.createObjectURL(blob);

        // ✅ Try Office Online if your file has a public URL
        const officeViewerUrl = selectedDoc.preview?.startsWith("http")
          ? `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(
              selectedDoc.preview
            )}`
          : null;

        return (
          <div>
            <img
              src="https://cdn-icons-png.flaticon.com/512/888/888883.png"
              alt="PowerPoint icon"
              style={{ width: "100px", marginBottom: "20px", opacity: 0.7 }}
            />
            <h3 style={{ color: "#444" }}>
              PowerPoint Preview Unavailable
            </h3>
            <p style={{ color: "#777", fontSize: "14px", marginBottom: "20px" }}>
              Browser-based PowerPoint preview isn’t supported without backend conversion.
            </p>

            {officeViewerUrl ? (
              <iframe
                src={officeViewerUrl}
                title="Online PowerPoint Preview"
                style={{
                  width: "100%",
                  height: "500px",
                  border: "none",
                  borderRadius: "6px",
                }}
              />
            ) : (
              <>
                <a
                  href={blobUrl}
                  download={selectedDoc.name || "presentation.pptx"}
                  style={{
                    display: "inline-block",
                    marginTop: "10px",
                    background: "#f04e23",
                    color: "#fff",
                    padding: "10px 20px",
                    borderRadius: "8px",
                    textDecoration: "none",
                  }}
                >
                  ⬇️ Download to View
                </a>
                <p style={{ marginTop: "10px", color: "#999", fontSize: "13px" }}>
                  (You can open it in PowerPoint or Google Slides.)
                </p>
              </>
            )}
          </div>
        );
      } catch (err) {
        console.error("PPTX preview failed:", err);
        return (
          <div style={{ padding: "20px", textAlign: "center" }}>
            ⚠️ PowerPoint preview unavailable.{" "}
            <a href={selectedDoc.preview} download>
              Click here to download
            </a>
          </div>
        );
      }
    })()}
  </div>
) :

// ✅ Image & GIF files
                    selectedDoc.mime?.toLowerCase().includes("png") ||
                      selectedDoc.mime?.toLowerCase().includes("jpeg") ||
                      selectedDoc.mime?.toLowerCase().includes("webp") ||
                      selectedDoc.mime?.toLowerCase().includes("svg") ||
                      selectedDoc.mime?.toLowerCase().includes("bmp") ||
                      selectedDoc.mime?.toLowerCase().includes("jpg") ? (
                      <img
                        src={selectedDoc.preview}
                        alt={
                          selectedDoc.document?.documentName ||
                          "Document Preview"
                        }
                        className="vd-doc-preview"
                        style={{
                          maxWidth: "100%",
                          maxHeight: "500px",
                          objectFit: "contain",
                          borderRadius: "8px",
                          boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                        }}
                      />
                    ) : selectedDoc.mime?.toLowerCase().includes("gif") ? (
                      <div className="vd-gif-preview">
                        <img
                          src={selectedDoc.preview}
                          alt={
                            selectedDoc.document?.documentName || "GIF Preview"
                          }
                          className="vd-doc-preview vd-gif-image"
                          style={{
                            maxWidth: "100%",
                            maxHeight: "500px",
                            objectFit: "contain",
                            borderRadius: "8px",
                            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                            cursor: "pointer",
                          }}
                          onClick={(e) => {
                            // Optional toggle pause/play behavior
                            const img = e.target;
                            const src = img.src;
                            if (img.dataset.paused === "true") {
                              // restore original GIF
                              img.src = src;
                              img.dataset.paused = "false";
                            } else {
                              // create paused frame
                              const canvas = document.createElement("canvas");
                              canvas.width = img.width;
                              canvas.height = img.height;
                              const ctx = canvas.getContext("2d");
                              ctx.drawImage(img, 0, 0, img.width, img.height);
                              img.src = canvas.toDataURL("image/png");
                              img.dataset.paused = "true";
                            }
                          }}
                        />
                        <p
                          style={{
                            textAlign: "center",
                            color: "#999",
                            marginTop: "5px",
                          }}
                        >
                          (Click to pause/play GIF)
                        </p>
                      </div>
                    ) : // ✅ HTML file preview
                    (selectedDoc.mime?.toLowerCase().includes("html") ||
                        selectedDoc.fileName?.toLowerCase().includes("htm")) &&
                      selectedDoc.fileData ? (
                      <div
                        className="vd-html-preview-wrapper"
                        style={{
                          maxHeight: "600px",
                          overflow: "auto",
                          border: "1px solid #ddd",
                          borderRadius: "8px",
                        }}
                      >
                        {(() => {
                          try {
                            // Decode base64 HTML content
                            const decoded = atob(selectedDoc.fileData);
                            // ⚠️ Use sandboxed iframe to safely render HTML
                            const blob = new Blob([decoded], {
                              type: "text/html",
                            });
                            const blobUrl = URL.createObjectURL(blob);

                            return (
                              <iframe
                                src={blobUrl}
                                title="HTML Preview"
                                className="vd-doc-preview"
                                style={{
                                  width: "100%",
                                  height: "500px",
                                  border: "none",
                                }}
                                sandbox="allow-same-origin allow-scripts"
                              />
                            );
                          } catch (err) {
                            console.error("HTML preview failed:", err);
                            return (
                              <p>
                                ⚠️ Failed to render HTML. You can still{" "}
                                <a href={selectedDoc.preview} download>
                                  download
                                </a>{" "}
                                the file.
                              </p>
                            );
                          }
                        })()}
                      </div>
                    ) : // ✅ XML file preview
                    (selectedDoc.mime?.toLowerCase().includes("xml") ||
                        selectedDoc.fileName?.toLowerCase().endsWith(".xml")) &&
                      selectedDoc.fileData ? (
                      <pre
                        className="vd-doc-preview vd-xml-preview"
                        style={{
                          maxHeight: "500px",
                          overflow: "auto",
                          background: "#f9f9f9",
                          padding: "10px",
                          borderRadius: "8px",
                          border: "1px solid #ddd",
                          fontFamily: "monospace",
                          whiteSpace: "pre-wrap",
                          wordWrap: "break-word",
                        }}
                      >
                        {(() => {
                          try {
                            const byteArray = Uint8Array.from(
                              atob(selectedDoc.fileData),
                              (c) => c.charCodeAt(0)
                            );
                            const decoded = new TextDecoder("utf-8").decode(
                              byteArray
                            );

                            // Optional: Pretty-format XML with indentation
                            const formattedXml = decoded
                              .replace(/></g, ">\n<")
                              .split("\n")
                              .map((line, i, arr) => {
                                let indent = 0;
                                if (i > 0) {
                                  const prev = arr[i - 1];
                                  if (
                                    prev.match(/<[^/!?][^>]*>$/) &&
                                    !prev.match(/<\/.+>$/)
                                  )
                                    indent++;
                                  if (line.match(/^<\/.+>/)) indent--;
                                }
                                return "  ".repeat(Math.max(indent, 0)) + line;
                              })
                              .join("\n");

                            return formattedXml;
                          } catch (err) {
                            console.error("XML preview failed:", err);
                            return "⚠️ Failed to render XML file. You can still download it.";
                          }
                        })()}
                      </pre>
                    ) : // ✅ Plain text (TXT) or LOG files
                    (selectedDoc.mime?.toLowerCase().includes("txt") ||
                        selectedDoc.mime?.toLowerCase().includes("log")) && // NOTE: I'm assuming you removed the octet-stream as suggested previously
                      selectedDoc.fileData ? (
                      <pre
                        className="vd-doc-preview"
                        style={{
                          maxHeight: "500px",
                          overflow: "auto",
                          whiteSpace: "pre-wrap",
                        }}
                      >
                        {(() => {
                          try {
                            const byteArray = Uint8Array.from(
                              atob(selectedDoc.fileData),
                              (c) => c.charCodeAt(0)
                            );
                            const decoded = new TextDecoder("utf-8").decode(
                              byteArray
                            );
                            return decoded;
                          } catch (err) {
                            console.error("LOG/TXT preview failed:", err);
                            return "⚠️ Failed to load log file. You can still download it.";
                          }
                        })()}
                      </pre>
                    ) : // ✅ RTF (.rtf) files
                    (selectedDoc.mime?.toLowerCase().includes("rtf") ||
                        selectedDoc.mime?.toLowerCase() === "application/rtf" ||
                        selectedDoc.mime?.toLowerCase() === "text/rtf" ||
                        selectedDoc.mime?.toLowerCase() ===
                          "application/msword") &&
                      selectedDoc.fileData ? (
                      <div
                        className="vd-doc-preview"
                        style={{
                          maxHeight: "500px",
                          overflow: "auto",
                          whiteSpace: "pre-wrap",
                        }}
                      >
                        {(() => {
                          try {
                            const byteArray = Uint8Array.from(
                              atob(selectedDoc.fileData),
                              (c) => c.charCodeAt(0)
                            );
                            const decoded = new TextDecoder("utf-8").decode(
                              byteArray
                            );

                            // Strip RTF syntax (basic cleanup)
                            const plainText = decoded
                              .replace(/\\par[d]?/g, "\n")
                              .replace(/\\'[0-9a-fA-F]{2}/g, "")
                              .replace(/\\[a-z]+\d* ?/g, "")
                              .replace(/[{}]/g, "")
                              .replace(/\n{2,}/g, "\n");

                            return (
                              <pre style={{ whiteSpace: "pre-wrap" }}>
                                {plainText.trim() || "Empty RTF file"}
                              </pre>
                            );
                          } catch (err) {
                            console.error("RTF preview failed:", err);
                            return (
                              <p>
                                ⚠️ Failed to render RTF file. You can still{" "}
                                <a href={selectedDoc.preview} download>
                                  download it
                                </a>
                                .
                              </p>
                            );
                          }
                        })()}
                      </div>
                    ) : // ✅ CSV file
                    selectedDoc.mime?.toLowerCase().includes("csv") &&
                      selectedDoc.fileData ? (
                      <div
                        className="vd-csv-preview-wrapper"
                        style={{ maxHeight: 500, overflow: "auto" }}
                      >
                        {(() => {
                          try {
                            const byteArray = Uint8Array.from(
                              atob(selectedDoc.fileData),
                              (c) => c.charCodeAt(0)
                            );
                            const decoded = new TextDecoder("utf-8").decode(
                              byteArray
                            );
                            const rows = decoded
                              .split(/\r?\n/)
                              .map((row) => row.split(","));
                            return (
                              <table
                                className="vd-csv-preview-table"
                                style={{
                                  borderCollapse: "collapse",
                                  width: "100%",
                                }}
                              >
                                <thead>
                                  <tr>
                                    {rows[0]?.map((cell, idx) => (
                                      <th
                                        key={idx}
                                        style={{
                                          border: "1px solid #ccc",
                                          padding: "4px",
                                          background: "#f5f5f5",
                                        }}
                                      >
                                        {cell}
                                      </th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody>
                                  {rows.slice(1).map((row, rIdx) => (
                                    <tr key={rIdx}>
                                      {row.map((cell, cIdx) => (
                                        <td
                                          key={cIdx}
                                          style={{
                                            border: "1px solid #ccc",
                                            padding: "4px",
                                          }}
                                        >
                                          {cell}
                                        </td>
                                      ))}
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            );
                          } catch (err) {
                            console.error("CSV preview failed:", err);
                            return (
                              <p>
                                ⚠️ Failed to load CSV. You can still{" "}
                                <a href={selectedDoc.preview} download>
                                  download
                                </a>{" "}
                                the file.
                              </p>
                            );
                          }
                        })()}
                      </div>
                    ) : // ✅ JSON
                    selectedDoc.mime?.toLowerCase().includes("json") &&
                      selectedDoc.fileData ? (
                      <pre
                        className="vd-doc-preview"
                        style={{ maxHeight: "500px", overflow: "auto" }}
                      >
                        {(() => {
                          try {
                            const decoded = atob(selectedDoc.fileData);
                            return JSON.stringify(JSON.parse(decoded), null, 2);
                          } catch (err) {
                            console.error("JSON preview failed:", err);
                            return "⚠️ Failed to parse JSON. You can still download the file.";
                          }
                        })()}
                      </pre>
                    ) : // ✅ MP4 video preview
                    (selectedDoc.mime?.toLowerCase().includes("mp4") ||
                        selectedDoc.fileName?.toLowerCase().endsWith(".mp4")) &&
                      selectedDoc.preview ? (
                      <div
                        className="vd-video-preview"
                        style={{ textAlign: "center" }}
                      >
                        <video
                          src={selectedDoc.preview}
                          controls
                          style={{
                            width: "100%",
                            maxHeight: "500px",
                            borderRadius: "8px",
                            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                            backgroundColor: "#000",
                          }}
                        >
                          Your browser does not support the video tag.
                        </video>
                        <p style={{ color: "#888", marginTop: "5px" }}>
                          🎥 MP4 Video Preview
                        </p>
                      </div>
                    ) : // ✅ MP3 audio preview
                    (selectedDoc.mime?.toLowerCase().includes("mp3") ||
                        selectedDoc.fileName?.toLowerCase().endsWith(".mp3")) &&
                      selectedDoc.preview ? (
                      <div
                        className="vd-audio-preview"
                        style={{ textAlign: "center" }}
                      >
                        <audio
                          controls
                          src={selectedDoc.preview}
                          style={{
                            width: "100%",
                            outline: "none",
                          }}
                        >
                          Your browser does not support the audio tag.
                        </audio>
                        <p style={{ color: "#888", marginTop: "5px" }}>
                          🎧 MP3 Audio Preview
                        </p>
                      </div>
                    ) : (
                      // ❌ Default fallback
                      <p>
                        Cannot preview this file type.{" "}
                        <a href={selectedDoc.preview} download>
                          Download
                        </a>
                      </p>
                    )
                  ) : (
                    <p></p>
                  )}
                </Spin>
              </div>
              <div className="vd-details-section">
                <h4 className="vd-custom-data-section">Document Details</h4>
                <table className="vd-details-table">
                  <tbody>
                    <tr>
                      <td>Guid</td>
                      <td>{selectedDoc.document?.guid || selectedDoc.guid}</td>
                    </tr>
                    <tr>
                      <td>Document Name</td>
                      <td>{selectedDoc.document?.documentName || "N/A"}</td>
                    </tr>
                    <tr>
                      <td>Document Title</td>
                      <td>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editedDetails.documentTitle || ""}
                            onChange={(e) =>
                              setEditedDetails({
                                ...editedDetails,
                                documentTitle: e.target.value,
                              })
                            }
                            className="vd-form-input"
                          />
                        ) : (
                          selectedDoc.document?.documentTitle || "N/A"
                        )}
                      </td>
                    </tr>
                    <tr>
                      <td>Upload Date</td>
                      <td>
                        {selectedDoc.createdAt
                          ? new Date(selectedDoc.createdAt).toLocaleString()
                          : "N/A"}
                      </td>
                    </tr>
                    <tr>
                      <td>Version</td>
                      <td>{selectedDoc.document?.version || "N/A"}</td>
                    </tr>
                    <tr>
                      <td>Mime Type</td>
                      <td>
                        {selectedDoc.document?.mimeType || selectedDoc.mime}
                      </td>
                    </tr>
                    {/* <tr>
        <td>Default Shared Location</td>
        <td>{selectedDoc.document?.defaultSharedLocation || "N/A"}</td>
      </tr> */}
                    <tr>
                      <td>Custom Classname</td>
                      <td>
                        {selectedDoc.document?.customClassName
                          ?.split(".")
                          .pop() || "N/A"}
                      </td>
                    </tr>
                    {isEditing && (
                      <tr>
                        <td>Replace File</td>
                        <td>
                          <input
                            type="file"
                            onChange={(e) =>
                              setEditedDetails({
                                ...editedDetails,
                                file: e.target.files[0],
                              })
                            }
                            className="vd-form-input"
                          />
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>

                {selectedDoc.customData && (
                  <div className="vd-custom-data-section">
                    <h4>Custom Data</h4>
                    <table className="vd-details-table">
                      <tbody>
                        {Object.entries(selectedDoc.customData || {})
                          // filter out id and guid from display
                          .filter(([key]) => key !== "id" && key !== "guid")
                          .map(([key, value]) => (
                            <tr key={key}>
                              <td>{key}</td>
                              <td>
                                {isEditing ? (
                                  key === "storageAreaId" ? (
                                    // make storageAreaId non-editable
                                    <span>{String(value)}</span>
                                  ) : (
                                    <input
                                      type="text"
                                      value={
                                        editedDetails.customData?.[key] !==
                                        undefined
                                          ? editedDetails.customData[key]
                                          : String(value)
                                      }
                                      onChange={(e) => {
                                        setEditedDetails((prev) => ({
                                          ...prev,
                                          customData: {
                                            ...prev.customData,
                                            [key]: e.target.value,
                                          },
                                        }));
                                      }}
                                      className="vd-form-input"
                                    />
                                  )
                                ) : (
                                  <span>{String(value)}</span>
                                )}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ViewDocuments;
