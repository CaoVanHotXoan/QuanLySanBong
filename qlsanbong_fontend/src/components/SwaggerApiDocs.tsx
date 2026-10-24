import React, { useState, useEffect, useMemo } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import {
  Search,
  Filter,
  Play,
  Copy,
  Check,
  ChevronDown,
  ChevronRight,
  Lock,
  Unlock,
  Server,
  Download,
  Eye,
  ArrowLeft,
  RefreshCw,
  Layers,
  Code2,
  FileText,
  ExternalLink,
  Shield,
  Zap,
  CheckCircle2,
  AlertCircle,
  XCircle,
  X
} from 'lucide-react';

interface Parameter {
  name: string;
  in: 'query' | 'path' | 'header';
  required?: boolean;
  description?: string;
  schema?: {
    type?: string;
    default?: any;
    example?: any;
    enum?: string[];
  };
}

interface Operation {
  tags?: string[];
  summary?: string;
  description?: string;
  operationId?: string;
  security?: any[];
  parameters?: Parameter[];
  requestBody?: {
    description?: string;
    required?: boolean;
    content?: {
      [mimeType: string]: {
        schema?: any;
        example?: any;
      };
    };
  };
  responses?: {
    [statusCode: string]: {
      description?: string;
      content?: {
        [mimeType: string]: {
          schema?: any;
          example?: any;
        };
      };
    };
  };
}

interface PathItem {
  get?: Operation;
  post?: Operation;
  put?: Operation;
  delete?: Operation;
  patch?: Operation;
}

interface OpenAPISpec {
  openapi: string;
  info: {
    title: string;
    description: string;
    version: string;
    contact?: {
      name?: string;
      email?: string;
      url?: string;
    };
    license?: {
      name?: string;
      url?: string;
    };
  };
  servers?: { url: string; description?: string }[];
  paths: { [path: string]: PathItem };
  components?: {
    schemas?: { [key: string]: any };
    securitySchemes?: { [key: string]: any };
  };
  tags?: { name: string; description?: string }[];
}

interface EndpointFlatItem {
  id: string;
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  operation: Operation;
  tag: string;
}

const METHOD_CONFIG: Record<string, {
  color: string;
  bgColor: string;
  badgeBg: string;
  borderColor: string;
  accentBg: string;
  darkBg: string;
  darkTextColor: string;
  darkSummaryColor: string;
}> = {
  GET: {
    color: '#0d6efd',
    bgColor: '#ebf3fb',
    badgeBg: '#4990e2',
    borderColor: '#b4d5fe',
    accentBg: 'rgba(73, 144, 226, 0.1)',
    darkBg: 'rgba(73, 144, 226, 0.22)',
    darkTextColor: '#93c5fd', // Xanh dương sáng đậm nét
    darkSummaryColor: '#f1f5f9' // Trắng sáng đậm
  },
  POST: {
    color: '#198754',
    bgColor: '#eaf7f2',
    badgeBg: '#49cc90',
    borderColor: '#a3e9c9',
    accentBg: 'rgba(73, 204, 144, 0.1)',
    darkBg: 'rgba(73, 204, 144, 0.22)',
    darkTextColor: '#6ee7b7', // Xanh lá ngọc sáng đậm nét
    darkSummaryColor: '#f1f5f9'
  },
  PUT: {
    color: '#d97706',
    bgColor: '#fdf6ed',
    badgeBg: '#fca130',
    borderColor: '#fcd39c',
    accentBg: 'rgba(252, 161, 48, 0.1)',
    darkBg: 'rgba(252, 161, 48, 0.25)',
    darkTextColor: '#fde047', // Vàng cam sáng đậm nét rực rỡ
    darkSummaryColor: '#f8fafc'
  },
  DELETE: {
    color: '#dc3545',
    bgColor: '#faecec',
    badgeBg: '#f93e3e',
    borderColor: '#fca5a5',
    accentBg: 'rgba(249, 62, 62, 0.1)',
    darkBg: 'rgba(249, 62, 62, 0.25)',
    darkTextColor: '#fca5a5', // Đỏ san hô sáng đậm nét
    darkSummaryColor: '#f8fafc'
  },
  PATCH: {
    color: '#0d9488',
    bgColor: '#e6faf5',
    badgeBg: '#50e3c2',
    borderColor: '#99f6e4',
    accentBg: 'rgba(80, 227, 194, 0.1)',
    darkBg: 'rgba(80, 227, 194, 0.22)',
    darkTextColor: '#5eead4', // Ngọc lam sáng đậm nét
    darkSummaryColor: '#f1f5f9'
  }
};

// Helper: Tự động trích xuất JSON mẫu phong phú từ OpenAPI Schema
function generateSampleFromSchema(schema: any, componentsSchemas?: Record<string, any>): any {
  if (!schema) return {};

  if (schema.$ref) {
    const refKey = schema.$ref.replace('#/components/schemas/', '');
    if (componentsSchemas && componentsSchemas[refKey]) {
      return generateSampleFromSchema(componentsSchemas[refKey], componentsSchemas);
    }
  }

  if (schema.example !== undefined) {
    return schema.example;
  }

  if (schema.type === 'object' || schema.properties) {
    const res: Record<string, any> = {};
    const props = schema.properties || {};
    Object.entries(props).forEach(([key, prop]: [string, any]) => {
      if (prop.example !== undefined) {
        res[key] = prop.example;
      } else if (prop.default !== undefined) {
        res[key] = prop.default;
      } else if (prop.enum && prop.enum.length > 0) {
        res[key] = prop.enum[0];
      } else if (prop.$ref) {
        res[key] = generateSampleFromSchema(prop, componentsSchemas);
      } else if (prop.type === 'string') {
        const k = key.toLowerCase();
        if (k.includes('email')) res[key] = 'admin@gmail.com';
        else if (k.includes('mat_khau') || k.includes('password')) res[key] = '123456';
        else if (k.includes('dien_thoai') || k.includes('phone')) res[key] = '0909123456';
        else if (k.includes('ho_ten') || k.includes('ten_nguoi_dung') || k.includes('name')) res[key] = 'Nguyễn Văn A';
        else if (k.includes('ngay') || k.includes('date')) res[key] = '2026-10-17';
        else if (k.includes('gio') || k.includes('time')) res[key] = '18:00';
        else if (k.includes('anh') || k.includes('url') || k.includes('hinh')) res[key] = 'https://res.cloudinary.com/sport247/image/upload/sample.jpg';
        else if (k.includes('video')) res[key] = 'https://res.cloudinary.com/sport247/video/upload/sample.mp4';
        else if (k.includes('otp')) res[key] = '123456';
        else if (k.includes('tieu_de') || k.includes('title')) res[key] = 'Tiêu đề bài viết mẫu';
        else if (k.includes('noi_dung') || k.includes('content') || k.includes('ghi_chu') || k.includes('mo_ta')) res[key] = 'Nội dung chi tiết mẫu';
        else if (k.includes('dia_chi') || k.includes('address')) res[key] = '123 Đường Số 1, Quận 1, TP.HCM';
        else if (k.includes('trang_thai') || k.includes('status')) res[key] = 'DA_THANH_TOAN';
        else res[key] = `Mau_${key}`;
      } else if (prop.type === 'integer' || prop.type === 'number') {
        const k = key.toLowerCase();
        if (k.includes('gia') || k.includes('tien') || k.includes('amount')) res[key] = 100000;
        else if (k.includes('so_luong') || k.includes('quantity')) res[key] = 1;
        else if (k.includes('vaitro') || k.includes('vai_tro')) res[key] = 2;
        else if (k.startsWith('ma_') || k.startsWith('ma') || k === 'id') res[key] = 1;
        else res[key] = 1;
      } else if (prop.type === 'boolean') {
        res[key] = true;
      } else if (prop.type === 'array') {
        res[key] = prop.items ? [generateSampleFromSchema(prop.items, componentsSchemas)] : [];
      } else {
        res[key] = `Mau_${key}`;
      }
    });
    return res;
  }

  if (schema.type === 'array') {
    return schema.items ? [generateSampleFromSchema(schema.items, componentsSchemas)] : [];
  }

  return {};
}

// Helper: Lấy cấu trúc JSON mẫu cho Request Body của Endpoint
function getSampleBody(ep: EndpointFlatItem, spec?: OpenAPISpec | null): any {
  const jsonContent = ep.operation.requestBody?.content?.['application/json'];
  if (jsonContent) {
    if (jsonContent.example) return jsonContent.example;
    if (jsonContent.schema) {
      const generated = generateSampleFromSchema(jsonContent.schema, spec?.components?.schemas);
      if (generated && Object.keys(generated).length > 0) return generated;
    }
  }
  // Dự phòng thông minh cho các phương thức gửi body (POST, PUT, PATCH)
  if (['POST', 'PUT', 'PATCH'].includes(ep.method)) {
    if (ep.path.includes('auth/login')) {
      return { email: 'admin@gmail.com', mat_khau: '123456' };
    }
    if (ep.path.includes('auth/register')) {
      return { ho_ten: 'Nguyễn Văn A', email: 'nguyenvana@gmail.com', so_dien_thoai: '0909123456', mat_khau: '123456' };
    }
    if (ep.path.includes('send-otp')) {
      return { email: 'admin@gmail.com', loai_otp: 'DOI_MAT_KHAU' };
    }
    if (ep.path.includes('verify-otp')) {
      return { email: 'admin@gmail.com', ma_otp: '123456', loai_otp: 'DOI_MAT_KHAU' };
    }
    if (ep.path.includes('change-password')) {
      return { email: 'admin@gmail.com', mat_khau_cu: '123456', mat_khau_moi: '654321' };
    }
    if (ep.path.includes('san-bong')) {
      return {
        ten_san: 'Sân A5 (5 người)',
        ma_loai_san: 1,
        hinh_anh: 'https://res.cloudinary.com/hpa8esqe/image/upload/v1790842122/quanlysanbong/edo8kzixwfki8iwut2tr.webp',
        don_gia_phut: 300,
        trang_thai: 'SAN_SANG'
      };
    }
    if (ep.path.includes('loai-san')) {
      return {
        ten_loai: 'Sân 5 Người (Tiêu chuẩn)',
        mo_ta: 'Mặt cỏ nhân tạo FIFA 2 sao, hệ thống đèn LED cao áp'
      };
    }
    if (ep.path.includes('khung-gio')) {
      return {
        gio_bat_dau: '06:00',
        gio_ket_thuc: '07:00',
        he_so_gia: 1.0
      };
    }
    if (ep.path.includes('vai-tro')) {
      return {
        ten_vai_tro: 'NhanVien',
        mo_ta: 'Nhân viên quản lý sân bóng'
      };
    }
    if (ep.path.includes('users')) {
      return {
        ho_ten: 'Nguyễn Văn B',
        so_dien_thoai: '0909123456',
        mat_khau: '123456',
        MaVaiTro: 2,
        anh_dai_dien: 'https://res.cloudinary.com/sport247/image/upload/avatar.jpg'
      };
    }
    if (ep.path.includes('dich-vu')) {
      return {
        ten_dich_vu: 'Nước tăng lực RedBull',
        don_gia: 20000,
        so_luong_ton: 100,
        don_vi_tinh: 'Lon',
        hinh_anh: 'https://res.cloudinary.com/sport247/image/upload/redbull.jpg'
      };
    }
    return { ten: 'Dữ liệu mẫu', trang_thai: 'HOAT_DONG' };
  }
  return null;
}

// Helper: Sinh mã nguồn gọi API chuẩn (cURL / Fetch / Axios) cho mọi method GET, POST, PUT, DELETE
function getEndpointSnippet(
  ep: EndpointFlatItem,
  serverUrl: string,
  params: Record<string, string> = {},
  bodyText: string = '',
  hasSecurity: boolean = false,
  jwtToken: string = '',
  lang: 'curl' | 'fetch' | 'axios' = 'curl'
): string {
  const cleanServer = (serverUrl || 'https://qlsbbackend.vercel.app').replace(/\/+$/, '');
  const cleanPath = ep.path.startsWith('/') ? ep.path : `/${ep.path}`;
  let url = `${cleanServer}${cleanPath}`;
  const queryParams = new URLSearchParams();

  if (ep.operation.parameters) {
    ep.operation.parameters.forEach(p => {
      const val = params[p.name] !== undefined && params[p.name] !== '' 
        ? params[p.name] 
        : (p.schema?.default !== undefined ? String(p.schema.default) : p.schema?.example !== undefined ? String(p.schema.example) : '1');
      if (p.in === 'path') {
        url = url.replace(`{${p.name}}`, encodeURIComponent(val));
      } else if (p.in === 'query') {
        queryParams.append(p.name, val);
      }
    });
  }

  const queryString = queryParams.toString();
  if (queryString) {
    url += (url.includes('?') ? '&' : '?') + queryString;
  }

  const headers: Record<string, string> = {};
  if (hasSecurity) {
    headers['Authorization'] = `Bearer ${jwtToken || '<YOUR_JWT_TOKEN>'}`;
  }
  const hasBody = ['POST', 'PUT', 'PATCH'].includes(ep.method) && bodyText && bodyText.trim() !== '';
  if (hasBody) {
    headers['Content-Type'] = 'application/json';
  }

  if (lang === 'curl') {
    let cmd = `curl -X ${ep.method} "${url}"`;
    Object.entries(headers).forEach(([k, v]) => {
      cmd += ` \\\n  -H "${k}: ${v}"`;
    });
    if (hasBody) {
      cmd += ` \\\n  -d '${bodyText.trim()}'`;
    }
    return cmd;
  }

  if (lang === 'fetch') {
    if (hasBody) {
      return `// Gọi API bằng JavaScript Fetch (${ep.method})
const response = await fetch("${url}", {
  method: "${ep.method}",
  headers: ${JSON.stringify(headers, null, 2).replace(/\n/g, '\n  ')},
  body: JSON.stringify(${bodyText.trim() || '{}'})
});
const result = await response.json();
console.log(result);`;
    } else {
      const hasHeaders = Object.keys(headers).length > 0;
      if (ep.method === 'GET' && !hasHeaders) {
        return `// Gọi API bằng JavaScript Fetch (GET)
const response = await fetch("${url}");
const result = await response.json();
console.log(result);`;
      }
      return `// Gọi API bằng JavaScript Fetch (${ep.method})
const response = await fetch("${url}", {
  method: "${ep.method}"${hasHeaders ? `,\n  headers: ${JSON.stringify(headers, null, 2).replace(/\n/g, '\n  ')}` : ''}
});
const result = await response.json();
console.log(result);`;
    }
  }

  if (lang === 'axios') {
    const hasHeaders = Object.keys(headers).length > 0;
    const configStr = hasHeaders ? `, {\n  headers: ${JSON.stringify(headers, null, 2).replace(/\n/g, '\n  ')}\n}` : '';
    if (hasBody) {
      return `// Gọi API bằng Axios (${ep.method})
import axios from 'axios';

const response = await axios.${ep.method.toLowerCase()}(
  "${url}",
  ${bodyText.trim() || '{}'}${configStr}
);
console.log(response.data);`;
    } else {
      return `// Gọi API bằng Axios (${ep.method})
import axios from 'axios';

const response = await axios.${ep.method.toLowerCase()}("${url}"${configStr});
console.log(response.data);`;
    }
  }

  return '';
}

export interface SwaggerApiDocsProps {
  standalone?: boolean;
  onBackToDashboard?: () => void;
  isDarkMode?: boolean;
}

export default function SwaggerApiDocs({
  standalone = true,
  onBackToDashboard,
  isDarkMode: externalDarkMode
}: SwaggerApiDocsProps) {
  const [spec, setSpec] = useState<OpenAPISpec | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeServer, setActiveServer] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      return isLocal ? 'http://localhost:5000' : 'https://qlsbbackend.vercel.app';
    }
    return 'https://qlsbbackend.vercel.app';
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('ALL');
  const [selectedMethod, setSelectedMethod] = useState<string>('ALL');
  const [expandedEndpoints, setExpandedEndpoints] = useState<Record<string, boolean>>({});
  const [expandedTags, setExpandedTags] = useState<Record<string, boolean>>({});
  
  // Auth token state for Try-It-Out
  const [jwtToken, setJwtToken] = useState<string>('');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authSavedMessage, setAuthSavedMessage] = useState(false);

  // Raw YAML modal
  const [isRawYamlModalOpen, setIsRawYamlModalOpen] = useState(false);
  const [rawYamlContent, setRawYamlContent] = useState<string>('');
  const [rawYamlLoading, setRawYamlLoading] = useState(false);
  const [copiedRawYaml, setCopiedRawYaml] = useState(false);

  // Try it out states per endpoint
  const [tryParams, setTryParams] = useState<Record<string, Record<string, string>>>({});
  const [tryBody, setTryBody] = useState<Record<string, string>>({});
  const [tryLoading, setTryLoading] = useState<Record<string, boolean>>({});
  const [codeSnippetTab, setCodeSnippetTab] = useState<Record<string, 'curl' | 'fetch' | 'axios'>>({});
  const [copiedSnippet, setCopiedSnippet] = useState<Record<string, boolean>>({});
  const [tryResponse, setTryResponse] = useState<Record<string, {
    status: number;
    statusText: string;
    timeMs: number;
    headers: Record<string, string>;
    data: any;
    curl: string;
  }>>({});

  // Schemas accordion
  const [showSchemas, setShowSchemas] = useState(false);
  const [expandedSchemas, setExpandedSchemas] = useState<Record<string, boolean>>({});

  // Realtime Dark Mode detection
  const [internalDarkMode, setInternalDarkMode] = useState(false);
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const checkDark = () => {
        const isHtmlDark = document.documentElement.classList.contains('dark');
        const isBodyDark = document.body.classList.contains('dark');
        setInternalDarkMode(isHtmlDark || isBodyDark);
      };
      checkDark();
      const observer = new MutationObserver(checkDark);
      observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
      return () => observer.disconnect();
    }
  }, []);

  const isDark = typeof externalDarkMode === 'boolean' ? externalDarkMode : internalDarkMode;

  // Load token from localStorage on mount if exists
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('token') || localStorage.getItem('auth_token') || '';
      if (stored) {
        setJwtToken(stored);
      }
    }
  }, []);

  // Fetch OpenAPI Spec JSON
  useEffect(() => {
    async function loadSpec() {
      try {
        setLoading(true);
        let data: OpenAPISpec | null = null;

        // Ưu tiên tải openapi.json trực tiếp từ public
        const res = await fetch('/openapi.json');
        if (res.ok) {
          data = await res.json();
        } else {
          // Fallback sang API endpoint hoặc OpenAPI.yaml
          const yamlRes = await fetch('/OpenAPI.yaml');
          if (yamlRes.ok) {
            const text = await yamlRes.text();
            const jsyaml = await import('js-yaml');
            data = jsyaml.load(text) as OpenAPISpec;
          } else {
            throw new Error('Không thể tải tệp tài liệu OpenAPI');
          }
        }

        if (data) {
          // Đảm bảo luôn có cả Cloud Vercel Production và Localhost trong danh sách servers
          const defaultServers = [
            { url: 'https://qlsbbackend.vercel.app', description: 'Máy chủ Cloud Vercel Production (https://qlsbbackend.vercel.app)' },
            { url: 'http://localhost:5000', description: 'Máy chủ Local Development (http://localhost:5000)' }
          ];

          let serversList = (data.servers && data.servers.length > 0) ? [...data.servers] : defaultServers;
          if (!serversList.some((s: any) => s.url.includes('qlsbbackend.vercel.app'))) {
            serversList.unshift({
              url: 'https://qlsbbackend.vercel.app',
              description: 'Máy chủ Cloud Vercel Production (https://qlsbbackend.vercel.app)'
            });
          }
          if (!serversList.some((s: any) => s.url.includes('localhost:5000'))) {
            serversList.push({
              url: 'http://localhost:5000',
              description: 'Máy chủ Local Development (http://localhost:5000)'
            });
          }
          data.servers = serversList;
          setSpec(data);

          // Tự động chọn server phù hợp theo môi trường duyệt web
          const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
          if (isLocal) {
            const localServer = serversList.find((s: any) => s.url.includes('localhost'));
            setActiveServer(localServer?.url || 'http://localhost:5000');
          } else {
            const cloudServer = serversList.find((s: any) => s.url.includes('qlsbbackend.vercel.app')) || serversList.find((s: any) => s.url.startsWith('https://'));
            setActiveServer(cloudServer?.url || 'https://qlsbbackend.vercel.app');
          }

          // Mặc định mở toàn bộ các nhóm API tags
          if (data.tags) {
            const initialTagState: Record<string, boolean> = {};
            data.tags.forEach((t: any) => { initialTagState[t.name] = true; });
            setExpandedTags(initialTagState);
          }
        }
      } catch (err: any) {
        setError(err.message || 'Lỗi khi tải tài liệu API');
      } finally {
        setLoading(false);
      }
    }
    loadSpec();
  }, []);

  // Load raw YAML text for viewer
  const handleOpenRawYaml = async () => {
    setIsRawYamlModalOpen(true);
    if (!rawYamlContent) {
      setRawYamlLoading(true);
      try {
        const res = await fetch('/OpenAPI.yaml');
        const text = await res.text();
        setRawYamlContent(text);
      } catch (e) {
        setRawYamlContent('# Không thể tải OpenAPI.yaml');
      } finally {
        setRawYamlLoading(false);
      }
    }
  };

  // Flatten endpoints
  const flatEndpoints: EndpointFlatItem[] = useMemo(() => {
    if (!spec || !spec.paths) return [];
    const items: EndpointFlatItem[] = [];
    const methods: ('get' | 'post' | 'put' | 'delete' | 'patch')[] = ['get', 'post', 'put', 'delete', 'patch'];

    Object.entries(spec.paths).forEach(([pathKey, pathObj]) => {
      methods.forEach((m) => {
        const op = pathObj[m];
        if (op) {
          const tag = (op.tags && op.tags.length > 0) ? op.tags[0] : 'Chung';
          items.push({
            id: `${m.toUpperCase()}_${pathKey}`,
            path: pathKey,
            method: m.toUpperCase() as any,
            operation: op,
            tag
          });
        }
      });
    });

    return items;
  }, [spec]);

  // Unique tags with counts
  const tagList = useMemo(() => {
    if (!flatEndpoints) return [];
    const tagMap: Record<string, number> = {};
    flatEndpoints.forEach(ep => {
      tagMap[ep.tag] = (tagMap[ep.tag] || 0) + 1;
    });
    return Object.entries(tagMap).map(([name, count]) => ({ name, count }));
  }, [flatEndpoints]);

  // Filtered endpoints
  const filteredEndpoints = useMemo(() => {
    return flatEndpoints.filter(ep => {
      // Tag filter
      if (selectedTag !== 'ALL' && ep.tag !== selectedTag) return false;
      // Method filter
      if (selectedMethod !== 'ALL' && ep.method !== selectedMethod) return false;
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const inPath = ep.path.toLowerCase().includes(q);
        const inSummary = (ep.operation.summary || '').toLowerCase().includes(q);
        const inDesc = (ep.operation.description || '').toLowerCase().includes(q);
        const inId = (ep.operation.operationId || '').toLowerCase().includes(q);
        const inTag = ep.tag.toLowerCase().includes(q);
        return inPath || inSummary || inDesc || inId || inTag;
      }
      return true;
    });
  }, [flatEndpoints, selectedTag, selectedMethod, searchQuery]);

  // Group filtered endpoints by Tag
  const groupedEndpoints = useMemo(() => {
    const groups: Record<string, EndpointFlatItem[]> = {};
    filteredEndpoints.forEach(ep => {
      if (!groups[ep.tag]) groups[ep.tag] = [];
      groups[ep.tag].push(ep);
    });
    return groups;
  }, [filteredEndpoints]);

  // Toggle Endpoint expanded
  const toggleEndpoint = (id: string, ep: EndpointFlatItem) => {
    setExpandedEndpoints(prev => {
      const next = !prev[id];
      // Prepopulate default try parameters and body if opening
      if (next) {
        // Params
        if (ep.operation.parameters && !tryParams[id]) {
          const defaults: Record<string, string> = {};
          ep.operation.parameters.forEach(p => {
            defaults[p.name] = p.schema?.default !== undefined 
              ? String(p.schema.default) 
              : p.schema?.example !== undefined 
              ? String(p.schema.example) 
              : p.in === 'path' ? '1' : '';
          });
          setTryParams(p => ({ ...p, [id]: defaults }));
        }
        // Body (tự động sinh JSON mẫu phong phú chuẩn 100% cho mọi method POST/PUT/PATCH)
        const needsBody = ep.operation.requestBody || ['POST', 'PUT', 'PATCH'].includes(ep.method);
        if (needsBody && !tryBody[id]) {
          const sample = getSampleBody(ep, spec);
          if (sample && Object.keys(sample).length > 0) {
            setTryBody(b => ({ ...b, [id]: JSON.stringify(sample, null, 2) }));
          } else {
            setTryBody(b => ({ ...b, [id]: '{\n  \n}' }));
          }
        }
      }
      return { ...prev, [id]: next };
    });
  };

  // Expand / Collapse all
  const toggleAll = (expand: boolean) => {
    const nextTagState: Record<string, boolean> = {};
    const nextEpState: Record<string, boolean> = {};
    tagList.forEach(t => { nextTagState[t.name] = expand; });
    flatEndpoints.forEach(ep => {
      nextEpState[ep.id] = expand;
      if (expand) {
        if (ep.operation.parameters && !tryParams[ep.id]) {
          const defaults: Record<string, string> = {};
          ep.operation.parameters.forEach(p => {
            defaults[p.name] = p.schema?.default !== undefined 
              ? String(p.schema.default) 
              : p.schema?.example !== undefined 
              ? String(p.schema.example) 
              : p.in === 'path' ? '1' : '';
          });
          setTryParams(p => ({ ...p, [ep.id]: defaults }));
        }
        const needsBody = ep.operation.requestBody || ['POST', 'PUT', 'PATCH'].includes(ep.method);
        if (needsBody && !tryBody[ep.id]) {
          const sample = getSampleBody(ep, spec);
          if (sample && Object.keys(sample).length > 0) {
            setTryBody(b => ({ ...b, [ep.id]: JSON.stringify(sample, null, 2) }));
          }
        }
      }
    });
    setExpandedTags(nextTagState);
    setExpandedEndpoints(nextEpState);
  };

  // Execute Try It Out API Call
  const handleExecute = async (ep: EndpointFlatItem) => {
    const epId = ep.id;
    const cleanServer = (activeServer || 'https://qlsbbackend.vercel.app').replace(/\/+$/, '');
    const cleanPath = ep.path.startsWith('/') ? ep.path : `/${ep.path}`;
    let finalUrl = `${cleanServer}${cleanPath}`;
    const pVals = tryParams[epId] || {};

    // Replace path parameters (e.g. {id} or :id)
    if (ep.operation.parameters) {
      ep.operation.parameters.forEach(p => {
        if (p.in === 'path') {
          const rawVal = pVals[p.name];
          const val = (rawVal !== undefined && String(rawVal).trim() !== '') 
            ? String(rawVal).trim() 
            : (p.schema?.default !== undefined ? String(p.schema.default) : p.schema?.example !== undefined ? String(p.schema.example) : '1');
          finalUrl = finalUrl.replace(`{${p.name}}`, encodeURIComponent(val));
        }
      });

      // Append query parameters
      const queryParams = new URLSearchParams();
      ep.operation.parameters.forEach(p => {
        if (p.in === 'query') {
          const val = pVals[p.name];
          if (val !== undefined && val !== '') {
            queryParams.append(p.name, val);
          }
        }
      });
      const queryString = queryParams.toString();
      if (queryString) {
        finalUrl += (finalUrl.includes('?') ? '&' : '?') + queryString;
      }
    }

    let bodyData: any = undefined;
    if (['POST', 'PUT', 'PATCH'].includes(ep.method)) {
      const rawText = tryBody[epId];
      if (rawText && rawText.trim()) {
        try {
          bodyData = JSON.parse(rawText);
        } catch (e) {
          alert('JSON trong Request Body không hợp lệ! Vui lòng kiểm tra lại cú pháp.');
          return;
        }
      }
    }

    const headers: Record<string, string> = {
      'Accept': 'application/json'
    };

    // Chỉ gửi Content-Type khi có dữ liệu body
    if (bodyData !== undefined) {
      headers['Content-Type'] = 'application/json';
    }

    // Tự động lấy token từ state hoặc LocalStorage nếu đã đăng nhập trên web
    const activeToken = jwtToken || (typeof window !== 'undefined' ? (localStorage.getItem('auth_token') || localStorage.getItem('token') || '') : '');
    if (activeToken) {
      headers['Authorization'] = `Bearer ${activeToken.trim()}`;
    }

    // Build Curl preview
    let curlCmd = `curl -X ${ep.method} "${finalUrl}"`;
    Object.entries(headers).forEach(([k, v]) => {
      curlCmd += ` \\\n  -H "${k}: ${v}"`;
    });
    if (bodyData) {
      curlCmd += ` \\\n  -d '${JSON.stringify(bodyData)}'`;
    }

    setTryLoading(l => ({ ...l, [epId]: true }));
    const startTime = performance.now();

    try {
      const res = await fetch(finalUrl, {
        method: ep.method,
        headers,
        body: bodyData ? JSON.stringify(bodyData) : undefined
      });

      const endTime = performance.now();
      const timeMs = Math.round(endTime - startTime);

      const respHeaders: Record<string, string> = {};
      res.headers.forEach((v, k) => { respHeaders[k] = v; });

      let respData: any = null;
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        respData = await res.json();
      } else {
        respData = await res.text();
      }

      setTryResponse(r => ({
        ...r,
        [epId]: {
          status: res.status,
          statusText: res.statusText || (res.status === 200 ? 'OK' : 'Error'),
          timeMs,
          headers: respHeaders,
          data: respData,
          curl: curlCmd
        }
      }));
    } catch (err: any) {
      const endTime = performance.now();
      setTryResponse(r => ({
        ...r,
        [epId]: {
          status: 0,
          statusText: 'Failed / Network Error',
          timeMs: Math.round(endTime - startTime),
          headers: {},
          data: { error: err.message || 'Không thể kết nối đến máy chủ. Kiểm tra CORS hoặc trạng thái Backend.' },
          curl: curlCmd
        }
      }));
    } finally {
      setTryLoading(l => ({ ...l, [epId]: false }));
    }
  };

  // Helper copy text
  const copyToClipboard = (text: string, cb?: () => void) => {
    navigator.clipboard.writeText(text);
    if (cb) cb();
  };

  if (loading) {
    return (
      <div className={`p-12 text-center flex flex-col items-center justify-center rounded-2xl ${standalone ? 'min-h-screen bg-[#1b1b1b] text-white' : 'bg-white dark:bg-[#1a1a1a] border border-slate-200 dark:border-slate-800'}`}>
        <RefreshCw className="w-10 h-10 text-[#49cc90] animate-spin mb-4" />
        <h2 className="text-base font-bold font-mono text-emerald-500">Đang khởi tạo Swagger & OpenAPI Specification...</h2>
        <p className="text-slate-400 text-xs mt-1.5">Nạp dữ liệu mô tả API cho Quản lý Sân Bóng Sport 247</p>
      </div>
    );
  }

  if (error || !spec) {
    return (
      <div className={`p-12 text-center flex flex-col items-center justify-center rounded-2xl ${standalone ? 'min-h-screen bg-[#1b1b1b] text-white' : 'bg-white dark:bg-[#1a1a1a] border border-slate-200 dark:border-slate-800'}`}>
        <AlertCircle className="w-10 h-10 text-rose-500 mb-4" />
        <h2 className="text-base font-bold text-rose-400">Không thể tải OpenAPI Specification</h2>
        <p className="text-slate-400 text-xs mt-1.5">{error}</p>
        {onBackToDashboard ? (
          <button
            onClick={onBackToDashboard}
            className="mt-4 px-4 py-2 bg-emerald-600 rounded-lg text-white font-bold text-xs hover:bg-emerald-500 cursor-pointer"
          >
            Quay lại Dashboard
          </button>
        ) : (
          <Link href="/Dashboard" className="mt-4 px-4 py-2 bg-emerald-600 rounded-lg text-white font-bold text-xs hover:bg-emerald-500">
            Quay lại Dashboard
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className={`w-full font-sans transition-colors ${standalone ? 'min-h-screen bg-[#fafafa] dark:bg-[#141414] text-slate-900 dark:text-slate-100' : 'text-slate-900 dark:text-slate-100'}`}>
      {standalone && (
        <Head>
          <title>OpenAPI.yaml - Sport 247 API Documentation (Swagger)</title>
          <meta name="description" content="Tài liệu API đầy đủ cho hệ thống quản lý sân bóng Sport 247 theo chuẩn OpenAPI 3.0 (Swagger UI)" />
        </Head>
      )}

      {/* SWAGGER TOPBAR (Dark authentic Swagger UI header) */}
      <header className={`z-30 bg-[#1b1b1b] border-b border-[#2d2d2d] shadow-md ${standalone ? 'sticky top-0 px-4 sm:px-6 py-2.5' : 'rounded-2xl p-3.5 mb-6'}`}>
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            {onBackToDashboard ? (
              <button
                type="button"
                onClick={onBackToDashboard}
                className="flex items-center gap-1.5 p-1.5 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white transition-all text-xs font-semibold cursor-pointer"
                title="Quay lại Tổng Quan Dashboard"
              >
                <ArrowLeft className="w-4 h-4 text-emerald-400" />
                <span>Dashboard</span>
              </button>
            ) : standalone ? (
              <Link 
                href="/Dashboard" 
                className="flex items-center gap-1.5 p-1.5 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white transition-all text-xs font-semibold"
                title="Quay lại Dashboard"
              >
                <ArrowLeft className="w-4 h-4 text-emerald-400" />
                <span>Dashboard</span>
              </Link>
            ) : null}

            <div className="h-5 w-[1px] bg-slate-700 hidden sm:block" />

            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-[#49cc90] flex items-center justify-center shadow-md shadow-emerald-500/20">
                <span className="text-black font-black text-xs tracking-tighter">{"{ }"}</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-extrabold text-white text-sm tracking-wide font-mono">SWAGGER</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-[#49cc90] border border-[#49cc90]/40">
                  OAS 3.0
                </span>
                <span className="text-[11px] font-mono text-slate-400 hidden md:inline">OpenAPI</span>
              </div>
            </div>
          </div>

          {/* Quick Actions & Server Selector */}
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            {/* Server dropdown */}
            <div className="flex items-center gap-1.5 bg-[#262626] border border-slate-700 rounded-lg px-2.5 py-1 text-xs">
              <Server className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <select
                value={activeServer}
                onChange={(e) => setActiveServer(e.target.value)}
                className="bg-transparent text-slate-200 outline-none cursor-pointer font-mono text-xs pr-1"
              >
                {spec.servers?.map((srv, idx) => (
                  <option key={idx} value={srv.url} className="bg-[#1b1b1b] text-white">
                    {srv.url} {srv.description ? `(${srv.description})` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Authorize Button */}
            <button
              type="button"
              onClick={() => setIsAuthModalOpen(true)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                jwtToken 
                  ? 'bg-emerald-500/20 text-[#49cc90] border-[#49cc90] hover:bg-emerald-500/30' 
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:border-slate-500 hover:text-white'
              }`}
            >
              {jwtToken ? <Lock className="w-3.5 h-3.5 text-[#49cc90]" /> : <Unlock className="w-3.5 h-3.5 text-amber-400" />}
              <span>Authorize {jwtToken ? '✓' : ''}</span>
            </button>

            {/* Raw YAML Modal Button */}
            <button
              type="button"
              onClick={handleOpenRawYaml}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 hover:text-white transition-all cursor-pointer"
              title="Xem nội dung mã nguồn tệp OpenAPI.yaml"
            >
              <FileText className="w-3.5 h-3.5 text-blue-400" />
              <span className="hidden sm:inline">Raw YAML</span>
            </button>

            {/* Download OpenAPI.yaml */}
            <a
              href="/OpenAPI.yaml"
              download="OpenAPI.yaml"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#49cc90] text-black hover:bg-[#3db880] transition-all shadow-sm cursor-pointer"
              title="Tải tệp đặc tả OpenAPI.yaml về máy"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Tải YAML</span>
            </a>
          </div>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <div className={standalone ? 'max-w-7xl mx-auto px-4 sm:px-6 py-6' : 'w-full'}>
        
        {/* API INFO HERO SECTION */}
        <section className="bg-white dark:bg-[#1a1a1a] rounded-2xl p-6 sm:p-7 shadow-sm border border-slate-200 dark:border-slate-800 mb-6">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  {spec.info.title}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 font-mono">
                  {spec.info.version}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-300 dark:border-blue-700 font-mono">
                  OAS 3.0.3
                </span>
              </div>

              <p className="mt-2.5 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line max-w-4xl">
                {spec.info.description}
              </p>

              {/* Meta details */}
              <div className="mt-3.5 flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                {spec.info.contact?.email && (
                  <div className="flex items-center gap-1">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">Liên hệ kỹ thuật:</span>
                    <a href={`mailto:${spec.info.contact.email}`} className="text-emerald-600 hover:underline">
                      {spec.info.contact.email}
                    </a>
                  </div>
                )}
                <div className="flex items-center gap-1 font-mono">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Base URL:</span>
                  <code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-emerald-600 dark:text-emerald-400">
                    {activeServer}
                  </code>
                </div>
              </div>
            </div>

            {/* Quick Metrics Badge */}
            <div className="bg-slate-50 dark:bg-[#222222] p-4 rounded-xl border border-slate-200 dark:border-slate-800 shrink-0 w-full md:w-64 space-y-2">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Thống kê API</div>
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <div className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                    {flatEndpoints.length}
                  </div>
                  <div className="text-[11px] text-slate-500">Endpoints</div>
                </div>
                <div>
                  <div className="text-xl font-black text-blue-600 dark:text-blue-400">
                    {tagList.length}
                  </div>
                  <div className="text-[11px] text-slate-500">Nhóm nghiệp vụ</div>
                </div>
                <div>
                  <div className="text-xl font-black text-amber-600 dark:text-amber-400">
                    {Object.keys(spec.components?.schemas || {}).length}
                  </div>
                  <div className="text-[11px] text-slate-500">Models CSDL</div>
                </div>
                <div>
                  <div className="text-xl font-black text-purple-600 dark:text-purple-400">
                    JWT
                  </div>
                  <div className="text-[11px] text-slate-500">Bảo mật Bearer</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CONTROLS BAR: SEARCH, FILTER, EXPAND ALL */}
        <section className="bg-white dark:bg-[#1a1a1a] rounded-xl p-3.5 shadow-sm border border-slate-200 dark:border-slate-800 mb-5 flex flex-col md:flex-row items-center justify-between gap-3">
          
          {/* Search box */}
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm kiếm API (vd: /dat-san, thanh-toan, dang-nhap)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition-colors"
            />
            {searchQuery && (
              <button 
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Method Filter & Tag Filter */}
          <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
            {/* Method Pills */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-900 rounded-lg p-1 border border-slate-200 dark:border-slate-800 text-xs font-black">
              {['ALL', 'GET', 'POST', 'PUT', 'DELETE'].map(m => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setSelectedMethod(m)}
                  className={`px-3 py-1 rounded-md transition-all cursor-pointer font-black ${
                    selectedMethod === m
                      ? m === 'GET' ? 'bg-[#4990e2] text-white shadow-sm'
                      : m === 'POST' ? 'bg-[#49cc90] text-black shadow-sm'
                      : m === 'PUT' ? 'bg-[#fca130] text-black shadow-sm font-black'
                      : m === 'DELETE' ? 'bg-[#f93e3e] text-white shadow-sm'
                      : 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white font-extrabold'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>

            {/* Expand / Collapse All */}
            <div className="flex items-center gap-1.5 ml-auto">
              <button
                type="button"
                onClick={() => toggleAll(true)}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
              >
                Mở tất cả
              </button>
              <button
                type="button"
                onClick={() => toggleAll(false)}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
              >
                Đóng tất cả
              </button>
            </div>
          </div>
        </section>

        {/* TAG TABS FILTER */}
        <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-5 no-scrollbar">
          <button
            type="button"
            onClick={() => setSelectedTag('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border cursor-pointer ${
              selectedTag === 'ALL'
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                : 'bg-white dark:bg-[#1a1a1a] text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-emerald-500'
            }`}
          >
            Tất cả ({flatEndpoints.length})
          </button>
          {tagList.map(t => (
            <button
              key={t.name}
              type="button"
              onClick={() => setSelectedTag(t.name)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border cursor-pointer ${
                selectedTag === t.name
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                  : 'bg-white dark:bg-[#1a1a1a] text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-emerald-500'
              }`}
            >
              {t.name} ({t.count})
            </button>
          ))}
        </div>

        {/* ENDPOINT LIST GROUPED BY TAGS */}
        <div className="space-y-6">
          {Object.keys(groupedEndpoints).length === 0 ? (
            <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl p-10 text-center border border-slate-200 dark:border-slate-800">
              <Search className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">Không tìm thấy Endpoint nào</h3>
              <p className="text-xs text-slate-400 mt-1">Vui lòng thử lại với từ khóa tìm kiếm hoặc bộ lọc khác.</p>
              <button
                type="button"
                onClick={() => { setSearchQuery(''); setSelectedMethod('ALL'); setSelectedTag('ALL'); }}
                className="mt-3 px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-500 cursor-pointer"
              >
                Xóa bộ lọc
              </button>
            </div>
          ) : (
            Object.entries(groupedEndpoints).map(([tagName, endpoints]) => {
              const tagInfo = spec.tags?.find(t => t.name === tagName);
              const isTagExpanded = expandedTags[tagName] ?? true;

              return (
                <div key={tagName} className="bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                  
                  {/* TAG HEADER BAR */}
                  <div
                    onClick={() => setExpandedTags(prev => ({ ...prev, [tagName]: !isTagExpanded }))}
                    className="p-3.5 sm:p-4 flex items-center justify-between cursor-pointer bg-slate-50/70 dark:bg-[#202020] hover:bg-slate-100/80 dark:hover:bg-[#262626] border-b border-slate-200 dark:border-slate-800 transition-colors select-none"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-2 h-5 bg-emerald-500 rounded-full" />
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-white tracking-tight">
                            {tagName}
                          </h2>
                          <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                            {endpoints.length} APIs
                          </span>
                        </div>
                        {tagInfo?.description && (
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                            {tagInfo.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                      {isTagExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </div>
                  </div>

                  {/* ENDPOINTS IN THIS TAG */}
                  {isTagExpanded && (
                    <div className="p-3 space-y-2.5 bg-slate-50/30 dark:bg-[#141414]/50">
                      {endpoints.map((ep) => {
                        const epId = ep.id;
                        const isExpanded = !!expandedEndpoints[epId];
                        const cfg = METHOD_CONFIG[ep.method] || METHOD_CONFIG.GET;
                        const hasSecurity = (ep.operation.security && ep.operation.security.length > 0) || 
                          (spec?.components?.securitySchemes && ep.path.startsWith('/api') && !['/api/auth/login', '/api/auth/register', '/api/tin-tuc', '/api/banner', '/api/about-us'].includes(ep.path));
                        const currentLang = codeSnippetTab[epId] || 'curl';
                        const snippetText = getEndpointSnippet(
                          ep,
                          activeServer,
                          tryParams[epId] || {},
                          tryBody[epId] || '',
                          !!hasSecurity,
                          jwtToken,
                          currentLang
                        );

                        return (
                          <div
                            key={epId}
                            className={`rounded-xl border transition-all duration-200 overflow-hidden shadow-xs ${
                              isDark ? 'bg-[#18181b] border-slate-800' : 'bg-white border-slate-200'
                            }`}
                            style={{
                              borderColor: isExpanded ? cfg.badgeBg : (isDark ? 'rgba(75, 85, 99, 0.4)' : 'rgba(156, 163, 175, 0.25)')
                            }}
                          >
                            {/* ENDPOINT SUMMARY STRIP */}
                            <div
                              onClick={() => toggleEndpoint(epId, ep)}
                              className={`p-3 flex items-center justify-between gap-3 cursor-pointer select-none transition-all ${
                                isDark ? 'hover:bg-white/5' : 'hover:opacity-95'
                              }`}
                              style={{
                                borderLeft: `5px solid ${cfg.badgeBg}`,
                                backgroundColor: isExpanded 
                                  ? (isDark ? cfg.darkBg : cfg.bgColor) 
                                  : (isDark ? '#1e1e1e' : undefined)
                              }}
                            >
                              <div className="flex items-center gap-3 min-w-0 flex-1">
                                {/* HTTP Method Badge */}
                                <span
                                  className="w-16 sm:w-20 text-center py-1 rounded-md text-[11px] sm:text-xs font-black font-mono tracking-wider text-white shadow-xs shrink-0"
                                  style={{ backgroundColor: cfg.badgeBg }}
                                >
                                  {ep.method}
                                </span>

                                {/* Path */}
                                <code
                                  className={`font-mono text-xs sm:text-sm font-black tracking-wide truncate ${
                                    isDark ? '' : 'text-slate-900'
                                  }`}
                                  style={{ color: isDark ? cfg.darkTextColor : undefined }}
                                >
                                  {ep.path}
                                </code>

                                {/* Summary */}
                                <span
                                  className={`text-xs font-extrabold truncate hidden md:inline ${
                                    isDark ? '' : 'text-slate-700'
                                  }`}
                                  style={{ color: isDark ? cfg.darkSummaryColor : undefined }}
                                >
                                  — {ep.operation.summary || ep.operation.description || ''}
                                </span>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                {hasSecurity && (
                                  <span title="Yêu cầu Bearer Token xác thực" className="text-slate-400">
                                    <Lock className="w-3.5 h-3.5 text-amber-500" />
                                  </span>
                                )}
                                <span className={isDark ? 'text-slate-200' : 'text-slate-400'}>
                                  {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                </span>
                              </div>
                            </div>

                            {/* EXPANDED ACCORDION PANEL */}
                            {isExpanded && (
                              <div className="p-4 sm:p-5 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1a1a1a] space-y-5">
                                
                                {/* Description */}
                                {ep.operation.description && (
                                  <div className="bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                                    <span className="font-bold text-slate-800 dark:text-slate-200 block mb-1">Mô tả chi tiết:</span>
                                    {ep.operation.description}
                                  </div>
                                )}

                                {/* PARAMETERS SECTION */}
                                <div>
                                  <div className="flex items-center justify-between mb-2">
                                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                                      Parameters ({ep.operation.parameters?.length || 0})
                                    </h4>
                                  </div>

                                  {!ep.operation.parameters || ep.operation.parameters.length === 0 ? (
                                    <div className="text-xs italic text-slate-400 bg-slate-50 dark:bg-slate-900/40 p-2.5 rounded-lg border border-dashed border-slate-200 dark:border-slate-800">
                                      Endpoint này không yêu cầu tham số URL (Parameters).
                                    </div>
                                  ) : (
                                    <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                                      <table className="w-full text-left text-xs">
                                        <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                                          <tr>
                                            <th className="p-2.5 w-40">Tên</th>
                                            <th className="p-2.5 w-24">Vị trí</th>
                                            <th className="p-2.5 w-36">Mô tả</th>
                                            <th className="p-2.5">Giá trị Test (Try It Out)</th>
                                          </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                          {ep.operation.parameters.map((param, pIdx) => {
                                            const currentVal = tryParams[epId]?.[param.name] ?? (param.schema?.default !== undefined ? String(param.schema.default) : '');
                                            return (
                                              <tr key={pIdx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                                                <td className="p-2.5 font-mono font-bold text-slate-900 dark:text-white">
                                                  {param.name}
                                                  {param.required && <span className="text-rose-500 ml-1 font-bold">*</span>}
                                                  <div className="text-[10px] text-slate-400 font-normal">
                                                    {param.schema?.type || 'string'}
                                                  </div>
                                                </td>
                                                <td className="p-2.5">
                                                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                                    {param.in}
                                                  </span>
                                                </td>
                                                <td className="p-2.5 text-slate-600 dark:text-slate-300">
                                                  {param.description || '—'}
                                                </td>
                                                <td className="p-2.5">
                                                  <input
                                                    type="text"
                                                    placeholder={param.schema?.example ? String(param.schema.example) : `Nhập ${param.name}`}
                                                    value={currentVal}
                                                    onChange={(e) => {
                                                      const val = e.target.value;
                                                      setTryParams(prev => ({
                                                        ...prev,
                                                        [epId]: {
                                                          ...(prev[epId] || {}),
                                                          [param.name]: val
                                                        }
                                                      }));
                                                    }}
                                                    className="w-full px-2.5 py-1 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono focus:border-emerald-500 focus:outline-none"
                                                  />
                                                </td>
                                              </tr>
                                            );
                                          })}
                                        </tbody>
                                      </table>
                                    </div>
                                  )}
                                </div>

                                {/* REQUEST BODY SECTION */}
                                {(ep.operation.requestBody || ['POST', 'PUT', 'PATCH'].includes(ep.method)) && (
                                  <div>
                                    <div className="flex items-center justify-between mb-2">
                                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                                        Request Body {(ep.operation.requestBody?.required ?? true) && <span className="text-rose-500">*</span>}
                                      </h4>
                                      <div className="flex items-center gap-2">
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const sample = getSampleBody(ep, spec);
                                            if (sample) {
                                              setTryBody(prev => ({ ...prev, [epId]: JSON.stringify(sample, null, 2) }));
                                            }
                                          }}
                                          className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer flex items-center gap-1"
                                          title="Nạp lại dữ liệu JSON mẫu chuẩn"
                                        >
                                          <RefreshCw className="w-3 h-3" />
                                          <span>Nạp mẫu JSON chuẩn</span>
                                        </button>
                                        <span className="text-slate-300 dark:text-slate-700">|</span>
                                        <button
                                          type="button"
                                          onClick={() => copyToClipboard(tryBody[epId] || '')}
                                          className="text-[11px] font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer flex items-center gap-1"
                                          title="Sao chép JSON sang bộ nhớ tạm"
                                        >
                                          <Copy className="w-3 h-3" />
                                          <span>Sao chép JSON</span>
                                        </button>
                                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                                          application/json
                                        </span>
                                      </div>
                                    </div>

                                    <div className="relative">
                                      <textarea
                                        rows={7}
                                        value={tryBody[epId] || ''}
                                        onChange={(e) => {
                                          const val = e.target.value;
                                          setTryBody(prev => ({ ...prev, [epId]: val }));
                                        }}
                                        placeholder="Nhập JSON Request Body..."
                                        className="w-full p-3 font-mono text-xs bg-slate-950 text-emerald-300 rounded-xl border border-slate-700 focus:border-emerald-500 focus:outline-none leading-relaxed"
                                      />
                                    </div>
                                  </div>
                                )}

                                {/* DELETE METHOD NOTICE */}
                                {ep.method === 'DELETE' && !ep.operation.requestBody && (
                                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2.5">
                                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
                                    <div className="leading-relaxed">
                                      <span className="font-bold">Phương thức DELETE:</span> Chuẩn RESTful dùng DELETE để xóa dữ liệu thông qua tham số trên URL (như <code>{`{id}`}</code>), không cần truyền Request Body. Bạn chỉ cần nhập ID cần xóa ở bảng Parameters phía trên rồi nhấn <span className="font-bold">"Execute"</span> hoặc sao chép mã nguồn mẫu bên dưới.
                                    </div>
                                  </div>
                                )}

                                {/* CODE SNIPPET SECTION (cURL / JavaScript Fetch / Axios) */}
                                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 p-3 sm:p-3.5 space-y-2">
                                  <div className="flex items-center justify-between flex-wrap gap-2">
                                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                                      <Code2 className="w-4 h-4 text-emerald-500" />
                                      <span>Mã nguồn mẫu ({currentLang === 'curl' ? 'cURL' : currentLang === 'fetch' ? 'JavaScript Fetch' : 'Axios'}):</span>
                                    </div>

                                    <div className="flex items-center gap-1.5">
                                      {(['curl', 'fetch', 'axios'] as const).map(lang => (
                                        <button
                                          key={lang}
                                          type="button"
                                          onClick={() => setCodeSnippetTab(prev => ({ ...prev, [epId]: lang }))}
                                          className={`px-2.5 py-1 rounded-md text-[11px] font-mono font-bold transition-all cursor-pointer ${
                                            currentLang === lang
                                              ? 'bg-emerald-600 text-white shadow-xs'
                                              : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-300 dark:hover:bg-slate-700'
                                          }`}
                                        >
                                          {lang === 'curl' ? 'cURL' : lang === 'fetch' ? 'Fetch JS' : 'Axios'}
                                        </button>
                                      ))}

                                      <button
                                        type="button"
                                        onClick={() => {
                                          copyToClipboard(snippetText);
                                          setCopiedSnippet(prev => ({ ...prev, [epId]: true }));
                                          setTimeout(() => {
                                            setCopiedSnippet(prev => ({ ...prev, [epId]: false }));
                                          }, 2000);
                                        }}
                                        className="ml-1 flex items-center gap-1 px-2.5 py-1 rounded bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-mono font-bold transition-colors cursor-pointer"
                                        title="Sao chép mã nguồn mẫu"
                                      >
                                        {copiedSnippet[epId] ? (
                                          <>
                                            <Check className="w-3 h-3 text-emerald-500" />
                                            <span className="text-emerald-500">Đã chép</span>
                                          </>
                                        ) : (
                                          <>
                                            <Copy className="w-3 h-3" />
                                            <span>Copy Code</span>
                                          </>
                                        )}
                                      </button>
                                    </div>
                                  </div>

                                  <pre className="p-3 bg-black/90 rounded-lg text-xs font-mono text-emerald-300 overflow-x-auto whitespace-pre-wrap leading-relaxed border border-slate-800 max-h-56">
                                    {snippetText}
                                  </pre>
                                </div>

                                {/* EXECUTE BUTTON BAR */}
                                <div className="flex items-center gap-3 pt-1">
                                  <button
                                    type="button"
                                    onClick={() => handleExecute(ep)}
                                    disabled={tryLoading[epId]}
                                    className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs text-white shadow-md transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 cursor-pointer"
                                    style={{ backgroundColor: cfg.badgeBg }}
                                  >
                                    {tryLoading[epId] ? (
                                      <>
                                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                        <span>Đang gửi yêu cầu...</span>
                                      </>
                                    ) : (
                                      <>
                                        <Play className="w-3.5 h-3.5 fill-white" />
                                        <span>Execute (Thực thi API)</span>
                                      </>
                                    )}
                                  </button>

                                  {hasSecurity && !jwtToken && (
                                    <span className="text-[11px] text-amber-500 flex items-center gap-1 font-medium">
                                      <AlertCircle className="w-3.5 h-3.5" />
                                      Cần Authorize Token trước khi gọi API có bảo mật
                                    </span>
                                  )}
                                </div>

                                {/* LIVE EXECUTION RESULTS (TRY IT OUT RESPONSE) */}
                                {tryResponse[epId] && (
                                  <div className="bg-slate-900 rounded-xl p-4 border border-slate-800 text-slate-200 space-y-3">
                                    <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                                      <div className="flex items-center gap-2">
                                        <span className="text-xs font-bold text-slate-400">Kết quả phản hồi:</span>
                                        <span
                                          className={`px-2.5 py-0.5 rounded-full text-xs font-black font-mono ${
                                            tryResponse[epId].status >= 200 && tryResponse[epId].status < 300
                                              ? 'bg-emerald-500/20 text-[#49cc90] border border-[#49cc90]/40'
                                              : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                                          }`}
                                        >
                                          {tryResponse[epId].status} {tryResponse[epId].statusText}
                                        </span>
                                        <span className="text-xs font-mono text-slate-400">
                                          ({tryResponse[epId].timeMs} ms)
                                        </span>
                                      </div>

                                      <button
                                        type="button"
                                        onClick={() => copyToClipboard(JSON.stringify(tryResponse[epId].data, null, 2))}
                                        className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-mono transition-colors cursor-pointer"
                                      >
                                        <Copy className="w-3 h-3" />
                                        <span>Copy JSON</span>
                                      </button>
                                    </div>

                                    {/* Curl command preview */}
                                    <div>
                                      <div className="text-[11px] font-mono text-slate-400 mb-1">Curl Command:</div>
                                      <pre className="bg-black/60 p-2.5 rounded-lg text-[11px] font-mono text-blue-300 overflow-x-auto whitespace-pre-wrap leading-relaxed border border-slate-800">
                                        {tryResponse[epId].curl}
                                      </pre>
                                    </div>

                                    {/* Response Body JSON */}
                                    <div>
                                      <div className="text-[11px] font-mono text-slate-400 mb-1">Response Body:</div>
                                      <pre className="bg-black/70 p-3 rounded-lg text-xs font-mono text-emerald-400 overflow-x-auto max-h-96 leading-relaxed border border-slate-800">
                                        {typeof tryResponse[epId].data === 'object'
                                          ? JSON.stringify(tryResponse[epId].data, null, 2)
                                          : String(tryResponse[epId].data)}
                                      </pre>
                                    </div>
                                  </div>
                                )}

                                {/* RESPONSES SCHEMA / DOCUMENTATION */}
                                <div>
                                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                                    Responses Chuẩn
                                  </h4>
                                  <div className="space-y-2">
                                    {Object.entries(ep.operation.responses || {}).map(([statusCode, resp]) => (
                                      <div
                                        key={statusCode}
                                        className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 text-xs flex flex-col sm:flex-row sm:items-start justify-between gap-2"
                                      >
                                        <div className="flex items-center gap-2">
                                          <span
                                            className={`font-mono font-bold px-2 py-0.5 rounded text-xs ${
                                              statusCode.startsWith('2')
                                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400'
                                                : statusCode.startsWith('4')
                                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-400'
                                                : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-400'
                                            }`}
                                          >
                                            {statusCode}
                                          </span>
                                          <span className="text-slate-700 dark:text-slate-300 font-medium">
                                            {resp.description || 'Thành công'}
                                          </span>
                                        </div>

                                        {resp.content?.['application/json']?.example && (
                                          <details className="text-[11px] font-mono text-slate-500">
                                            <summary className="cursor-pointer hover:text-emerald-600">
                                              Xem mẫu dữ liệu trả về
                                            </summary>
                                            <pre className="mt-2 p-2 rounded bg-slate-900 text-emerald-300 overflow-x-auto">
                                              {JSON.stringify(resp.content['application/json'].example, null, 2)}
                                            </pre>
                                          </details>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>

                              </div>
                            )}

                          </div>
                        );
                      })}
                    </div>
                  )}

                </div>
              );
            })
          )}
        </div>

        {/* SCHEMAS / MODELS SECTION AT BOTTOM */}
        <section className="mt-8 bg-white dark:bg-[#1a1a1a] rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-200 dark:border-slate-800">
          <div
            onClick={() => setShowSchemas(!showSchemas)}
            className="flex items-center justify-between cursor-pointer select-none"
          >
            <div className="flex items-center gap-3">
              <Layers className="w-5 h-5 text-emerald-500" />
              <div>
                <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                  Schemas & Data Models ({Object.keys(spec.components?.schemas || {}).length})
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Cấu trúc bảng CSDL và DTO (Data Transfer Object) chuẩn hóa của dự án
                </p>
              </div>
            </div>

            <div className="text-slate-400">
              {showSchemas ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
            </div>
          </div>

          {showSchemas && (
            <div className="mt-5 space-y-3.5 border-t border-slate-100 dark:border-slate-800 pt-4">
              {Object.entries(spec.components?.schemas || {}).map(([schemaName, schemaObj]: [string, any]) => {
                const isExpanded = !!expandedSchemas[schemaName];
                return (
                  <div key={schemaName} className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                    <div
                      onClick={() => setExpandedSchemas(prev => ({ ...prev, [schemaName]: !isExpanded }))}
                      className="p-2.5 bg-slate-50 dark:bg-slate-900/60 flex items-center justify-between cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-emerald-600 dark:text-emerald-400">
                          {schemaName}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          ({schemaObj.type || 'object'})
                        </span>
                      </div>
                      {isExpanded ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                    </div>

                    {isExpanded && schemaObj.properties && (
                      <div className="p-3.5 bg-white dark:bg-[#1a1a1a] overflow-x-auto">
                        <table className="w-full text-left text-xs font-mono">
                          <thead>
                            <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400">
                              <th className="pb-2 w-48">Trường dữ liệu</th>
                              <th className="pb-2 w-32">Kiểu</th>
                              <th className="pb-2">Mô tả / Ví dụ</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {Object.entries(schemaObj.properties).map(([propName, propDef]: [string, any]) => (
                              <tr key={propName}>
                                <td className="py-2 text-slate-900 dark:text-white font-bold">
                                  {propName}
                                  {schemaObj.required?.includes(propName) && (
                                    <span className="text-rose-500 ml-1 font-bold">*</span>
                                  )}
                                </td>
                                <td className="py-2 text-emerald-600 dark:text-emerald-400">
                                  {propDef.type || 'any'}
                                </td>
                                <td className="py-2 text-slate-600 dark:text-slate-300">
                                  {propDef.description || '—'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

      </div>

      {/* AUTHORIZE JWT MODAL */}
      {isAuthModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#1f1f1f] rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-200 dark:border-slate-700 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-emerald-500" />
                <h3 className="font-black text-slate-900 dark:text-white text-sm sm:text-base">
                  Available Authorizations (Bearer JWT)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAuthModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-3">
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Nhập mã token JWT (không cần gõ tiền tố <code>Bearer</code>) để xác thực các lệnh gọi API được bảo vệ:
              </p>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Value (Token):
                </label>
                <textarea
                  rows={4}
                  value={jwtToken}
                  onChange={(e) => setJwtToken(e.target.value)}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono text-emerald-400 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {authSavedMessage && (
                <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Đã lưu Authorization Header thành công!</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
              {jwtToken && (
                <button
                  type="button"
                  onClick={() => {
                    setJwtToken('');
                    localStorage.removeItem('token');
                    setAuthSavedMessage(false);
                  }}
                  className="px-4 py-2 text-xs font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors cursor-pointer"
                >
                  Logout (Xóa Token)
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  if (jwtToken.trim()) {
                    localStorage.setItem('token', jwtToken.trim());
                  }
                  setAuthSavedMessage(true);
                  setTimeout(() => {
                    setIsAuthModalOpen(false);
                    setAuthSavedMessage(false);
                  }, 800);
                }}
                className="px-4 py-2 text-xs font-bold bg-[#49cc90] text-black hover:bg-[#3db880] rounded-xl transition-all shadow-sm cursor-pointer"
              >
                Authorize & Lưu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RAW YAML MODAL */}
      {isRawYamlModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-[#1b1b1b] rounded-2xl max-w-4xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-700">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-white text-sm font-mono">OpenAPI.yaml (Specification Document)</h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    copyToClipboard(rawYamlContent, () => {
                      setCopiedRawYaml(true);
                      setTimeout(() => setCopiedRawYaml(false), 2000);
                    });
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white text-xs font-mono border border-slate-700 transition-colors cursor-pointer"
                >
                  {copiedRawYaml ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedRawYaml ? 'Đã sao chép' : 'Sao chép'}</span>
                </button>

                <a
                  href="/OpenAPI.yaml"
                  download="OpenAPI.yaml"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#49cc90] text-black text-xs font-bold hover:bg-[#3db880] transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Tải về</span>
                </a>

                <button
                  type="button"
                  onClick={() => setIsRawYamlModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-4 overflow-y-auto flex-1 font-mono text-xs text-emerald-300 bg-black/80 leading-relaxed">
              {rawYamlLoading ? (
                <div className="flex items-center justify-center py-12 text-slate-400">
                  <RefreshCw className="w-6 h-6 animate-spin mr-2 text-emerald-400" />
                  <span>Đang tải nội dung OpenAPI.yaml...</span>
                </div>
              ) : (
                <pre className="whitespace-pre-wrap">{rawYamlContent}</pre>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
