import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import "../../styles/ViewDocuments.css";
import api from "../../api/axiosInstance";
import alertService from "../../services/alertService";
import { Pagination } from "antd";
import { EyeOutlined } from '@ant-design/icons';
import { Button } from 'antd';
import { useNavigate } from "react-router-dom";
import { Typography, } from "antd";
import { Spin, Space } from 'antd'; 
const ViewDocuments = () => {
    const [selectedDoc, setSelectedDoc] = useState(null);
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10); 
    const [totalElements, setTotalElements] = useState(0);
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [isFilterVisible, setIsFilterVisible] = useState(true);
    const [filters, setFilters] = useState([
        { field: 'storageAreaId', values: [''], operatorToNext: 'AND' }
    ]);
const { Title } = Typography;
    const authState = useSelector((state) => state.auth.user);
    const authToken =
        useSelector((state) => state.auth.user?.authToken) ||
        localStorage.getItem("authToken");
    const userId = authState?.userId;
const [previewLoading, setPreviewLoading] = useState(false);
    const filterOptions = [
        { value: 'storageAreaId', label: 'Storage Area Id' },
        { value: 'documentName', label: 'Document Name' },
        { value: 'documentTitle', label: 'Document Title' },
        { value: 'mimeType', label: 'Mime Type' },
        { value: 'defaultSharedLocation', label: 'Default Shared Location' },
        { value: 'version', label: 'Version' }
    ];

    const fetchDocuments = async (currentFilters, currentSearchQuery, currentPage, currentSize = pageSize) => {
        if (!authToken || !userId) {
            alertService.error("Authentication Error", "User is not logged in.");
            return;
        }

        setLoading(true);
        try {
            const payload = {
                fieldValueList:
                    currentFilters.length > 0 && currentFilters[0].values.some(val => val.trim() !== "")
                        ? currentFilters.map(f => ({
                            field: f.field,
                            values: f.values.filter(val => val.trim() !== ""),
                            operatorToNext: f.operatorToNext
                        }))
                        : null,
                content: currentSearchQuery || null,
            };

            if (payload.fieldValueList && payload.fieldValueList.every(f => f.values.length === 0)) {
                payload.fieldValueList = null;
            }

            const { data } = await api.post(
                `/candocspro/get-all-documents?page=${currentPage - 1}&size=${currentSize}&userId=${userId}`,
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
            const message = error.response?.data?.message || "Failed to fetch documents from server.";
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
        preview: null,
        document: null,
        customData: null,
    });

    setPreviewLoading(true); // Start the loading spin

    try {
        const { data } = await api.post(
            `/candocspro/get-file?storageAreaId=${doc.storageId}&guid=${doc.guid}`,
            {}
        );

        let previewUrl = "";
        if (data.fileData) {
            const byteArray = Uint8Array.from(atob(data.fileData), (c) => c.charCodeAt(0));
            const mimeType = data.mimeType || doc.mime || "application/pdf";
            const blob = new Blob([byteArray], { type: mimeType });
            previewUrl = URL.createObjectURL(blob);
        }

        // Update selectedDoc with preview
        setSelectedDoc((prev) => ({
            ...prev,
            preview: previewUrl,
            document: data.document,
            customData: data.customData,
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


    const addFilter = () => {
        setFilters([...filters, { field: 'storageAreaId', values: [''], operatorToNext: 'AND' }]);
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
            newFilters[filterIndex].values.push('');
        }
        setFilters(newFilters);
    };

    const updateFilterField = (index, field) => {
        const newFilters = [...filters];
        newFilters[index].field = field;
        newFilters[index].values = [''];
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
        setFilters([{ field: 'storageAreaId', values: [''], operatorToNext: 'AND' }]);
        setSearchQuery('');
        setPage(1);
        fetchDocuments([], '', 1);
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
                    <button className="vd-btn vd-btn-primary" onClick={() => navigate('/admin/fileupload')}>
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
            <button className="vd-btn vd-btn-outline" onClick={toggleFilterVisibility}>
                {isFilterVisible ? 'Hide Filters' : 'Show Filters'}
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
        onChange={(e) => updateFilterField(index, e.target.value)}
        >
        {filterOptions.map(option => (
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
    </div></div></div>

            <div className="vd-filter-operator">
            <div className="vd-form-group">
                <label>Operator</label>
                <select
                    className="vd-form-select"
                    value={filter.operatorToNext}
                    onChange={(e) => updateFilterOperator(index, e.target.value)}
                >
                    <option value="AND">AND</option>
                    <option value="OR">OR</option>
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
                        if (e.key === 'Enter') {
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
                    <th>Default Shared Location</th>
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
                            <td><span className="vd-badge vd-badge-primary">{doc.location}</span></td>
                            <td>{doc.version}</td>
                            <td><span className={`vd-badge ${doc.storageId.includes('S3') ? 'vd-badge-success' : 'vd-badge-primary'}`} >
                             {doc.storageId}
                            </span>
                            </td>
                            <td className="vd-actions">
                                <Button
                                
                                    type="link"
                                    title="View"
                                    onClick={() => fetchFile(doc)}
                                    icon={<EyeOutlined />}
                                    className="vd-custom-view-btn" >
                                    View
                                </Button>
                            </td></tr>
                    ))
                ) : (
                    <tr>
                        <td colSpan="7" className="vd-no-documents-found">No documents found.</td>
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
                                pageSizeOptions={['10', '20', '50', '100']}
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
                            <h3>Guid - {selectedDoc.guid}</h3>
                            <button
                                className="vd-close-btn"
                                onClick={() => setSelectedDoc(null)}
                            >
                                &times;
                            </button>
                        </div>
                       
                        <div className="vd-modal-body">
                            <div className="vd-preview-section">
                                 <Spin spinning={previewLoading} size="large" tip="">
                                {selectedDoc?.preview ? (
                                    selectedDoc.mime?.toLowerCase().includes("pdf") ? (
                                        <iframe
                                            src={selectedDoc.preview}
                                            title="Document Preview"
                                            className="vd-doc-preview"
                                            style={{ width: "100%", height: "500px" }}
                                        />
                                    ) : (
                                        <img
                                            src={selectedDoc.preview}
                                            alt={selectedDoc.document?.documentName || "Document Preview"}
                                            className="vd-doc-preview"
                                        />
                                    )
                                ) : (
                                    <p></p>
                                )}
                                    </Spin>
                            </div>
                            <div className="vd-details-section">
                                <h4 className="vd-custom-data-section">Document Details</h4>
                                <table className="vd-details-table">
                                    <tbody><tr><td>Guid</td>
                                    <td>{selectedDoc.document?.guid || selectedDoc.guid}</td></tr>
                                    <tr><td>Document Name</td>
                                    <td>{selectedDoc.document?.documentName || "N/A"}</td></tr>
                                    <tr><td>Document Title</td>
                                    <td>{selectedDoc.document?.documentTitle || "N/A"}</td></tr>
                                    <tr><td>Version</td>
                                    <td>{selectedDoc.document?.version || "N/A"}</td></tr>
                                    <tr><td>Mime Type</td>
                                    <td>{selectedDoc.document?.mimeType || selectedDoc.mime}</td></tr>
                                    <tr><td>Default Shared Location</td>
                                    <td>{selectedDoc.document?.defaultSharedLocation || "N/A"}</td></tr>
                                    <tr><td>Custom Classname</td>
                                    <td>{selectedDoc.document?.customClassName?.split('.').pop() || "N/A"} </td></tr>
                                    </tbody>
                                </table>
                                {selectedDoc.customData && (
                                    <div className="vd-custom-data-section">
                                        <table className="vd-details-table">
                                            <tbody>
                                                {Object.entries(selectedDoc.customData)
                                                    .filter(
                                                        ([key]) =>
                                                            !["id", "guid", "storageAreaId"].includes(key)
                                                    )
                                                    .map(([key, value]) => (
                                                        <tr key={key}>
                                                            <td>{key}</td>
                                                            <td>{String(value)}</td>
                                                        </tr>
                                                    ))}
                                            </tbody> </table>
                                    </div>
                                )}
                            </div>  </div>

                    </div></div>
            )}
        </div>
    );
};

export default ViewDocuments;