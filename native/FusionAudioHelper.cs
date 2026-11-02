// Fusion-X Audio Helper
// Kleines Hintergrundprogramm, das mit dem Windows-Audiosystem (Core Audio / WASAPI) spricht.
// Kommunikation: eine JSON-Zeile pro Befehl über stdin, eine JSON-Zeile pro Antwort über stdout.
// Bewusst in C# 5 geschrieben, damit es auch mit dem in Windows eingebauten Compiler
// (C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe) gebaut werden kann.

using System;
using System.Collections;
using System.Collections.Generic;
using System.Diagnostics;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Drawing.Imaging;
using System.IO;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading;
using System.Web.Script.Serialization;
using Microsoft.Win32;

namespace FusionAudio
{
    // ------------------------------------------------------------------ Core-Audio-Typen

    public enum EDataFlow { Render = 0, Capture = 1, All = 2 }
    public enum ERole { Console = 0, Multimedia = 1, Communications = 2 }

    [StructLayout(LayoutKind.Sequential)]
    public struct PROPERTYKEY
    {
        public Guid fmtid;
        public int pid;
        public PROPERTYKEY(string g, int p) { fmtid = new Guid(g); pid = p; }
    }

    [StructLayout(LayoutKind.Sequential)]
    public struct PROPVARIANT
    {
        public ushort vt;
        public ushort r1;
        public ushort r2;
        public ushort r3;
        public IntPtr p1;
        public IntPtr p2;
    }

    [ComImport, Guid("BCDE0395-E52F-467C-8E3D-C4579291692E")]
    class MMDeviceEnumeratorCom { }

    [ComImport, Guid("A95664D2-9614-4F35-A746-DE8DB63617E6"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
    interface IMMDeviceEnumerator
    {
        void EnumAudioEndpoints(EDataFlow dataFlow, uint stateMask, out IMMDeviceCollection devices);
        void GetDefaultAudioEndpoint(EDataFlow dataFlow, ERole role, out IMMDevice endpoint);
        void GetDevice([MarshalAs(UnmanagedType.LPWStr)] string id, out IMMDevice device);
        void RegisterEndpointNotificationCallback(IntPtr client);
        void UnregisterEndpointNotificationCallback(IntPtr client);
    }

    [ComImport, Guid("0BD7A1BE-7A1A-44DB-8397-CC5392387B5E"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
    interface IMMDeviceCollection
    {
        void GetCount(out uint count);
        void Item(uint index, out IMMDevice device);
    }

    [ComImport, Guid("D666063F-1587-4E43-81F1-B948E807363F"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
    interface IMMDevice
    {
        void Activate(ref Guid iid, uint clsCtx, IntPtr activationParams, [MarshalAs(UnmanagedType.IUnknown)] out object iface);
        void OpenPropertyStore(uint access, out IPropertyStore props);
        void GetId([MarshalAs(UnmanagedType.LPWStr)] out string id);
        void GetState(out uint state);
    }

    [ComImport, Guid("886d8eeb-8cf2-4446-8d02-cdba1dbdcf99"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
    interface IPropertyStore
    {
        void GetCount(out uint count);
        void GetAt(uint index, out PROPERTYKEY key);
        [PreserveSig] int GetValue(ref PROPERTYKEY key, out PROPVARIANT value);
        void SetValue(ref PROPERTYKEY key, ref PROPVARIANT value);
        void Commit();
    }

    [ComImport, Guid("5CDF2C82-841E-4546-9722-0CF74078229A"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
    interface IAudioEndpointVolume
    {
        void RegisterControlChangeNotify(IntPtr notify);
        void UnregisterControlChangeNotify(IntPtr notify);
        void GetChannelCount(out uint count);
        void SetMasterVolumeLevel(float levelDb, ref Guid ctx);
        void SetMasterVolumeLevelScalar(float level, ref Guid ctx);
        void GetMasterVolumeLevel(out float levelDb);
        void GetMasterVolumeLevelScalar(out float level);
        void SetChannelVolumeLevel(uint channel, float levelDb, ref Guid ctx);
        void SetChannelVolumeLevelScalar(uint channel, float level, ref Guid ctx);
        void GetChannelVolumeLevel(uint channel, out float levelDb);
        void GetChannelVolumeLevelScalar(uint channel, out float level);
        void SetMute([MarshalAs(UnmanagedType.Bool)] bool mute, ref Guid ctx);
        void GetMute([MarshalAs(UnmanagedType.Bool)] out bool mute);
        void GetVolumeStepInfo(out uint step, out uint stepCount);
        void VolumeStepUp(ref Guid ctx);
        void VolumeStepDown(ref Guid ctx);
        void QueryHardwareSupport(out uint mask);
        void GetVolumeRange(out float minDb, out float maxDb, out float incDb);
    }

    [ComImport, Guid("C02216F6-8C67-4B5B-9D00-D008E73E0064"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
    interface IAudioMeterInformation
    {
        void GetPeakValue(out float peak);
        void GetMeteringChannelCount(out uint count);
        void GetChannelsPeakValues(uint count, IntPtr values);
        void QueryHardwareSupport(out uint mask);
    }

    [ComImport, Guid("77AA99A0-1BD6-484F-8BC7-2C654C9A9B6F"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
    interface IAudioSessionManager2
    {
        void GetAudioSessionControl(IntPtr sessionGuid, uint flags, out IntPtr control);
        void GetSimpleAudioVolume(IntPtr sessionGuid, uint flags, out IntPtr volume);
        void GetSessionEnumerator(out IAudioSessionEnumerator enumerator);
        void RegisterSessionNotification(IntPtr notification);
        void UnregisterSessionNotification(IntPtr notification);
        void RegisterDuckNotification([MarshalAs(UnmanagedType.LPWStr)] string sessionId, IntPtr notification);
        void UnregisterDuckNotification(IntPtr notification);
    }

    [ComImport, Guid("E2F5BB11-0570-40CA-ACDD-3AA01277DEE8"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
    interface IAudioSessionEnumerator
    {
        void GetCount(out int count);
        void GetSession(int index, out IAudioSessionControl2 session);
    }

    [ComImport, Guid("bfb7ff88-7239-4fc9-8fa2-07c950be9c6d"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
    interface IAudioSessionControl2
    {
        // IAudioSessionControl
        void GetState(out int state);
        void GetDisplayName([MarshalAs(UnmanagedType.LPWStr)] out string name);
        void SetDisplayName([MarshalAs(UnmanagedType.LPWStr)] string name, ref Guid ctx);
        void GetIconPath([MarshalAs(UnmanagedType.LPWStr)] out string path);
        void SetIconPath([MarshalAs(UnmanagedType.LPWStr)] string path, ref Guid ctx);
        void GetGroupingParam(out Guid param);
        void SetGroupingParam(ref Guid param, ref Guid ctx);
        void RegisterAudioSessionNotification(IntPtr client);
        void UnregisterAudioSessionNotification(IntPtr client);
        // IAudioSessionControl2
        void GetSessionIdentifier([MarshalAs(UnmanagedType.LPWStr)] out string id);
        void GetSessionInstanceIdentifier([MarshalAs(UnmanagedType.LPWStr)] out string id);
        void GetProcessId(out uint pid);
        [PreserveSig] int IsSystemSoundsSession();
        void SetDuckingPreference([MarshalAs(UnmanagedType.Bool)] bool optOut);
    }

    [ComImport, Guid("87CE5498-68D6-44E5-9215-6DA47EF883D8"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
    interface ISimpleAudioVolume
    {
        void SetMasterVolume(float level, ref Guid ctx);
        void GetMasterVolume(out float level);
        void SetMute([MarshalAs(UnmanagedType.Bool)] bool mute, ref Guid ctx);
        void GetMute([MarshalAs(UnmanagedType.Bool)] out bool mute);
    }

    // Standardgerät festlegen (seit Windows Vista unverändert, von vielen Tools genutzt)
    [ComImport, Guid("870af99c-171d-4f9e-af0d-e63df40c2bc9")]
    class CPolicyConfigClient { }

    [ComImport, Guid("f8679f50-850a-41cf-9c72-430f290290c8"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
    interface IPolicyConfig
    {
        [PreserveSig] int GetMixFormat([MarshalAs(UnmanagedType.LPWStr)] string id, IntPtr format);
        [PreserveSig] int GetDeviceFormat([MarshalAs(UnmanagedType.LPWStr)] string id, int isDefault, IntPtr format);
        [PreserveSig] int ResetDeviceFormat([MarshalAs(UnmanagedType.LPWStr)] string id);
        [PreserveSig] int SetDeviceFormat([MarshalAs(UnmanagedType.LPWStr)] string id, IntPtr endpointFormat, IntPtr mixFormat);
        [PreserveSig] int GetProcessingPeriod([MarshalAs(UnmanagedType.LPWStr)] string id, int isDefault, IntPtr defaultPeriod, IntPtr minPeriod);
        [PreserveSig] int SetProcessingPeriod([MarshalAs(UnmanagedType.LPWStr)] string id, IntPtr period);
        [PreserveSig] int GetShareMode([MarshalAs(UnmanagedType.LPWStr)] string id, IntPtr mode);
        [PreserveSig] int SetShareMode([MarshalAs(UnmanagedType.LPWStr)] string id, IntPtr mode);
        [PreserveSig] int GetPropertyValue([MarshalAs(UnmanagedType.LPWStr)] string id, IntPtr key, IntPtr value);
        [PreserveSig] int SetPropertyValue([MarshalAs(UnmanagedType.LPWStr)] string id, IntPtr key, IntPtr value);
        [PreserveSig] int SetDefaultEndpoint([MarshalAs(UnmanagedType.LPWStr)] string id, ERole role);
        [PreserveSig] int SetEndpointVisibility([MarshalAs(UnmanagedType.LPWStr)] string id, int visible);
    }

    // Ausgabegerät pro App (Windows.Media.Internal.AudioPolicyConfig, wie in den Windows-Einstellungen
    // unter "App-Lautstärke und Geräteeinstellungen"). Die ersten drei Einträge sind IInspectable.
    [ComImport, Guid("ab3d4648-e242-459f-b02f-541c70306324"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
    interface IAudioPolicyConfigFactory21H2
    {
        void Inspectable_GetIids(); void Inspectable_GetRuntimeClassName(); void Inspectable_GetTrustLevel();
        void _1(); void _2(); void _3(); void _4(); void _5(); void _6(); void _7(); void _8(); void _9(); void _10();
        void _11(); void _12(); void _13(); void _14(); void _15(); void _16(); void _17(); void _18(); void _19();
        [PreserveSig] int SetPersistedDefaultAudioEndpoint(uint processId, EDataFlow flow, ERole role, IntPtr deviceId);
        [PreserveSig] int GetPersistedDefaultAudioEndpoint(uint processId, EDataFlow flow, ERole role, out IntPtr deviceId);
        [PreserveSig] int ClearAllPersistedApplicationDefaultEndpoints();
    }

    [ComImport, Guid("2a59116d-6c4f-45e0-a74f-707e3fef9258"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
    interface IAudioPolicyConfigFactoryDownlevel
    {
        void Inspectable_GetIids(); void Inspectable_GetRuntimeClassName(); void Inspectable_GetTrustLevel();
        void _1(); void _2(); void _3(); void _4(); void _5(); void _6(); void _7(); void _8(); void _9(); void _10();
        void _11(); void _12(); void _13(); void _14(); void _15(); void _16(); void _17(); void _18(); void _19();
        [PreserveSig] int SetPersistedDefaultAudioEndpoint(uint processId, EDataFlow flow, ERole role, IntPtr deviceId);
        [PreserveSig] int GetPersistedDefaultAudioEndpoint(uint processId, EDataFlow flow, ERole role, out IntPtr deviceId);
        [PreserveSig] int ClearAllPersistedApplicationDefaultEndpoints();
    }

    static class Native
    {
        [DllImport("ole32.dll")] public static extern int PropVariantClear(ref PROPVARIANT pvar);
        [DllImport("kernel32.dll", SetLastError = true)] public static extern IntPtr OpenProcess(uint access, bool inherit, uint pid);
        [DllImport("kernel32.dll", SetLastError = true)] public static extern bool CloseHandle(IntPtr h);
        [DllImport("kernel32.dll", SetLastError = true, CharSet = CharSet.Unicode)]
        public static extern bool QueryFullProcessImageName(IntPtr h, uint flags, StringBuilder name, ref uint size);
        [DllImport("combase.dll", PreserveSig = true)] public static extern int RoGetActivationFactory(IntPtr classId, ref Guid iid, out IntPtr factory);
        [DllImport("combase.dll", CharSet = CharSet.Unicode, PreserveSig = true)] public static extern int WindowsCreateString(string src, int length, out IntPtr hstring);
        [DllImport("combase.dll", PreserveSig = true)] public static extern int WindowsDeleteString(IntPtr hstring);
        [DllImport("combase.dll", PreserveSig = true)] public static extern IntPtr WindowsGetStringRawBuffer(IntPtr hstring, out uint length);

        // Tastatur- und Maus-Hooks für die Sprechtaste (Push-to-Talk)
        public delegate IntPtr HookProc(int nCode, IntPtr wParam, IntPtr lParam);
        [DllImport("user32.dll", SetLastError = true)] public static extern IntPtr SetWindowsHookEx(int idHook, HookProc lpfn, IntPtr hMod, uint threadId);
        [DllImport("user32.dll")] public static extern IntPtr CallNextHookEx(IntPtr hhk, int nCode, IntPtr wParam, IntPtr lParam);
        [DllImport("user32.dll")] public static extern int GetMessage(out MSG msg, IntPtr hWnd, uint min, uint max);
        [DllImport("kernel32.dll", CharSet = CharSet.Unicode)] public static extern IntPtr GetModuleHandle(string name);
    }

    [StructLayout(LayoutKind.Sequential)]
    public struct MSG { public IntPtr hwnd; public uint message; public IntPtr wParam; public IntPtr lParam; public uint time; public int x; public int y; }

    // ------------------------------------------------------------------ Datenhaltung

    class Endpoint
    {
        public string Id;
        public EDataFlow Flow;
        public IMMDevice Device;
        public IAudioEndpointVolume Volume;
        public IAudioMeterInformation Meter;
        public IAudioSessionManager2 Sessions;
        public Dictionary<string, object> Info;
    }

    class Session
    {
        public string Key;
        public uint Pid;
        public string DeviceId;
        public EDataFlow Flow;
        public bool IsSystem;
        public int State;
        public ISimpleAudioVolume Volume;
        public IAudioMeterInformation Meter;
        public ProcInfo Proc;
    }

    class ProcInfo
    {
        public string Name;
        public string Exe;
        public string Path;
    }

    // ------------------------------------------------------------------ Programm

    static class Program
    {
        const string Version = "1.1.0";
        const uint DEVICE_STATE_ACTIVE = 1;
        const uint CLSCTX_ALL = 23;
        const string RenderSuffix = "#{e6327cad-dcec-4949-ae8a-991e976a79d2}";
        const string CaptureSuffix = "#{2eef81be-33fa-4800-9670-1cd474972c3f}";
        const string MmDevApiPrefix = @"\\?\SWD#MMDEVAPI#";

        static readonly PROPERTYKEY PKEY_FriendlyName = new PROPERTYKEY("a45c254e-df1c-4efd-8020-67d146a850e0", 14);
        static readonly PROPERTYKEY PKEY_DeviceDesc = new PROPERTYKEY("a45c254e-df1c-4efd-8020-67d146a850e0", 2);
        static readonly PROPERTYKEY PKEY_EnumeratorName = new PROPERTYKEY("a45c254e-df1c-4efd-8020-67d146a850e0", 24);
        static readonly PROPERTYKEY PKEY_InterfaceFriendlyName = new PROPERTYKEY("026e516e-b814-414b-83cd-856d6fef4822", 2);
        static readonly PROPERTYKEY PKEY_FormFactor = new PROPERTYKEY("1da5d803-d492-4edd-8c23-e0c0ffee7f0e", 0);
        static readonly PROPERTYKEY PKEY_DeviceFormat = new PROPERTYKEY("f19f064d-082c-4e27-bc73-6882a1bb8e4c", 0);

        static Guid IID_IAudioEndpointVolume = new Guid("5CDF2C82-841E-4546-9722-0CF74078229A");
        static Guid IID_IAudioMeterInformation = new Guid("C02216F6-8C67-4B5B-9D00-D008E73E0064");
        static Guid IID_IAudioSessionManager2 = new Guid("77AA99A0-1BD6-484F-8BC7-2C654C9A9B6F");
        static Guid EventContext = new Guid("7a9c3e61-3f0b-4d55-9b0e-5f1c063f0630");

        static IMMDeviceEnumerator enumerator;
        static readonly Dictionary<string, Endpoint> endpoints = new Dictionary<string, Endpoint>();
        static readonly List<Session> sessions = new List<Session>();
        static readonly Dictionary<uint, ProcInfo> procCache = new Dictionary<uint, ProcInfo>();
        static DateTime lastSessionScan = DateTime.MinValue;
        static readonly JavaScriptSerializer json = new JavaScriptSerializer();
        static StreamWriter output;

        [MTAThread]
        static int Main(string[] args)
        {
            json.MaxJsonLength = int.MaxValue;
            var input = new StreamReader(Console.OpenStandardInput(), new UTF8Encoding(false));
            output = new StreamWriter(Console.OpenStandardOutput(), new UTF8Encoding(false));
            output.AutoFlush = true;

            try
            {
                enumerator = (IMMDeviceEnumerator)new MMDeviceEnumeratorCom();
                RefreshEndpoints();
            }
            catch (Exception e)
            {
                Emit(Event("fatal", "Windows-Audio konnte nicht gestartet werden: " + e.Message));
                return 1;
            }

            Emit(Event("ready", Version));

            string line;
            while ((line = input.ReadLine()) != null)
            {
                line = line.Trim();
                if (line.Length == 0) continue;
                object id = null;
                var reply = new Dictionary<string, object>();
                try
                {
                    var req = json.DeserializeObject(line) as Dictionary<string, object>;
                    if (req == null) throw new Exception("Ungültiger Befehl");
                    req.TryGetValue("id", out id);
                    string cmd = Str(req, "cmd");
                    if (cmd == "quit") break;
                    reply["result"] = Handle(cmd, req);
                    reply["ok"] = true;
                }
                catch (Exception e)
                {
                    reply["ok"] = false;
                    reply["error"] = e.Message;
                }
                reply["id"] = id;
                Emit(reply);
            }
            return 0;
        }

        static void Emit(Dictionary<string, object> obj)
        {
            lock (output) { output.WriteLine(json.Serialize(obj)); }
        }

        static Dictionary<string, object> Event(string name, string detail)
        {
            var d = new Dictionary<string, object>();
            d["event"] = name;
            d["detail"] = detail;
            return d;
        }

        // ------------------------------------------------------------------ Befehle

        static object Handle(string cmd, Dictionary<string, object> req)
        {
            switch (cmd)
            {
                case "hello": return Hello();
                case "devices": RefreshEndpoints(); return DeviceList();
                case "poll": return Poll(Bool(req, "force"));
                case "setAppVolume": return ForSessions(req, delegate(Session s) { s.Volume.SetMasterVolume(Clamp01(Num(req, "value")), ref EventContext); });
                case "setAppMute": return ForSessions(req, delegate(Session s) { s.Volume.SetMute(Bool(req, "muted"), ref EventContext); });
                case "setDeviceVolume":
                    {
                        Endpoint ep = GetEndpoint(Str(req, "device"));
                        ep.Volume.SetMasterVolumeLevelScalar(Clamp01(Num(req, "value")), ref EventContext);
                        return true;
                    }
                case "setDeviceMute":
                    {
                        Endpoint ep = GetEndpoint(Str(req, "device"));
                        ep.Volume.SetMute(Bool(req, "muted"), ref EventContext);
                        return true;
                    }
                case "setDefault": return SetDefault(Str(req, "device"), Str(req, "roles"));
                case "setAppOutput": return SetAppOutput(req);
                case "getAppOutput": return GetAppOutput((uint)Num(req, "pid"));
                case "icon": return IconPng(Str(req, "path"));
                case "asio": return AsioDrivers();
                case "watchKeys": return WatchKeys(req);
                default: throw new Exception("Unbekannter Befehl: " + cmd);
            }
        }

        static object Hello()
        {
            var d = new Dictionary<string, object>();
            d["version"] = Version;
            d["os"] = Environment.OSVersion.Version.ToString();
            d["build"] = Environment.OSVersion.Version.Build;
            d["is64"] = Environment.Is64BitProcess;
            d["appOutput"] = PolicyFactoryAvailable();
            return d;
        }

        // ------------------------------------------------------------------ Geräte

        static void RefreshEndpoints()
        {
            var seen = new HashSet<string>();
            foreach (EDataFlow flow in new EDataFlow[] { EDataFlow.Render, EDataFlow.Capture })
            {
                IMMDeviceCollection col;
                enumerator.EnumAudioEndpoints(flow, DEVICE_STATE_ACTIVE, out col);
                uint count;
                col.GetCount(out count);
                for (uint i = 0; i < count; i++)
                {
                    IMMDevice dev;
                    col.Item(i, out dev);
                    string id;
                    dev.GetId(out id);
                    seen.Add(id);
                    Endpoint ep;
                    if (!endpoints.TryGetValue(id, out ep))
                    {
                        ep = new Endpoint();
                        ep.Id = id;
                        ep.Flow = flow;
                        ep.Device = dev;
                        object o;
                        try { dev.Activate(ref IID_IAudioEndpointVolume, CLSCTX_ALL, IntPtr.Zero, out o); ep.Volume = (IAudioEndpointVolume)o; } catch { }
                        try { dev.Activate(ref IID_IAudioMeterInformation, CLSCTX_ALL, IntPtr.Zero, out o); ep.Meter = (IAudioMeterInformation)o; } catch { }
                        try { dev.Activate(ref IID_IAudioSessionManager2, CLSCTX_ALL, IntPtr.Zero, out o); ep.Sessions = (IAudioSessionManager2)o; } catch { }
                        endpoints[id] = ep;
                    }
                    ep.Info = ReadInfo(ep);
                }
            }
            var gone = new List<string>();
            foreach (string key in endpoints.Keys) if (!seen.Contains(key)) gone.Add(key);
            foreach (string key in gone) endpoints.Remove(key);
            lastSessionScan = DateTime.MinValue;
        }

        static Dictionary<string, object> ReadInfo(Endpoint ep)
        {
            var d = new Dictionary<string, object>();
            d["id"] = ep.Id;
            d["flow"] = ep.Flow == EDataFlow.Render ? "render" : "capture";
            IPropertyStore props = null;
            try { ep.Device.OpenPropertyStore(0, out props); } catch { }
            d["name"] = ReadString(props, PKEY_FriendlyName);
            d["desc"] = ReadString(props, PKEY_DeviceDesc);
            d["adapter"] = ReadString(props, PKEY_InterfaceFriendlyName);
            d["enumerator"] = ReadString(props, PKEY_EnumeratorName);
            d["formFactor"] = ReadUInt(props, PKEY_FormFactor);
            d["format"] = ReadFormat(props);
            return d;
        }

        static List<object> DeviceList()
        {
            string defR = DefaultId(EDataFlow.Render, ERole.Console), defRC = DefaultId(EDataFlow.Render, ERole.Communications);
            string defC = DefaultId(EDataFlow.Capture, ERole.Console), defCC = DefaultId(EDataFlow.Capture, ERole.Communications);
            var list = new List<object>();
            foreach (Endpoint ep in endpoints.Values)
            {
                var d = new Dictionary<string, object>(ep.Info);
                float vol = 1f;
                bool muted = false;
                if (ep.Volume != null)
                {
                    try { ep.Volume.GetMasterVolumeLevelScalar(out vol); ep.Volume.GetMute(out muted); } catch { }
                }
                d["volume"] = Math.Round(vol, 3);
                d["muted"] = muted;
                bool render = ep.Flow == EDataFlow.Render;
                d["isDefault"] = ep.Id == (render ? defR : defC);
                d["isDefaultComms"] = ep.Id == (render ? defRC : defCC);
                list.Add(d);
            }
            return list;
        }

        static string DefaultId(EDataFlow flow, ERole role)
        {
            try
            {
                IMMDevice dev;
                enumerator.GetDefaultAudioEndpoint(flow, role, out dev);
                string id;
                dev.GetId(out id);
                return id;
            }
            catch { return null; }
        }

        static Endpoint GetEndpoint(string id)
        {
            Endpoint ep;
            if (id == null || !endpoints.TryGetValue(id, out ep))
            {
                RefreshEndpoints();
                if (id == null || !endpoints.TryGetValue(id, out ep)) throw new Exception("Gerät nicht gefunden");
            }
            if (ep.Volume == null) throw new Exception("Dieses Gerät lässt sich nicht regeln");
            return ep;
        }

        static object SetDefault(string id, string roles)
        {
            if (string.IsNullOrEmpty(id)) throw new Exception("Kein Gerät angegeben");
            var cfg = (IPolicyConfig)new CPolicyConfigClient();
            var list = new List<ERole>();
            if (roles == "comms") list.Add(ERole.Communications);
            else if (roles == "console") { list.Add(ERole.Console); list.Add(ERole.Multimedia); }
            else { list.Add(ERole.Console); list.Add(ERole.Multimedia); list.Add(ERole.Communications); }
            foreach (ERole r in list)
            {
                int hr = cfg.SetDefaultEndpoint(id, r);
                if (hr != 0) throw new Exception("Windows hat das Standardgerät nicht übernommen (0x" + hr.ToString("X8") + ")");
            }
            return true;
        }

        // ------------------------------------------------------------------ Sessions (Apps)

        static void ScanSessions()
        {
            sessions.Clear();
            var alive = new HashSet<uint>();
            foreach (Endpoint ep in endpoints.Values)
            {
                if (ep.Sessions == null) continue;
                IAudioSessionEnumerator en;
                try { ep.Sessions.GetSessionEnumerator(out en); } catch { continue; }
                int count;
                en.GetCount(out count);
                for (int i = 0; i < count; i++)
                {
                    try
                    {
                        IAudioSessionControl2 ctl;
                        en.GetSession(i, out ctl);
                        int state;
                        ctl.GetState(out state);
                        if (state == 2) continue; // abgelaufen
                        var s = new Session();
                        ctl.GetProcessId(out s.Pid);
                        s.IsSystem = ctl.IsSystemSoundsSession() == 0;
                        if (s.Pid == 0 && !s.IsSystem) continue;
                        s.State = state;
                        s.DeviceId = ep.Id;
                        s.Flow = ep.Flow;
                        s.Volume = (ISimpleAudioVolume)ctl;
                        try { s.Meter = (IAudioMeterInformation)ctl; } catch { }
                        s.Proc = s.IsSystem ? SystemProc() : GetProc(s.Pid);
                        s.Key = ep.Id + "|" + s.Pid + "|" + i;
                        alive.Add(s.Pid);
                        sessions.Add(s);
                    }
                    catch { }
                }
            }
            var stale = new List<uint>();
            foreach (uint pid in procCache.Keys) if (!alive.Contains(pid)) stale.Add(pid);
            foreach (uint pid in stale) procCache.Remove(pid);
            lastSessionScan = DateTime.UtcNow;
        }

        static object Poll(bool force)
        {
            if (force || (DateTime.UtcNow - lastSessionScan).TotalMilliseconds > 900) ScanSessions();
            var list = new List<object>();
            foreach (Session s in sessions)
            {
                var d = new Dictionary<string, object>();
                float vol = 1f, peak = 0f;
                bool muted = false;
                try { s.Volume.GetMasterVolume(out vol); s.Volume.GetMute(out muted); } catch { continue; }
                if (s.Meter != null) { try { s.Meter.GetPeakValue(out peak); } catch { } }
                d["key"] = s.Key;
                d["pid"] = (long)s.Pid;
                d["device"] = s.DeviceId;
                d["flow"] = s.Flow == EDataFlow.Render ? "render" : "capture";
                d["system"] = s.IsSystem;
                d["active"] = s.State == 1;
                d["name"] = s.Proc.Name;
                d["exe"] = s.Proc.Exe;
                d["path"] = s.Proc.Path;
                d["volume"] = Math.Round(vol, 3);
                d["muted"] = muted;
                d["peak"] = Math.Round(peak, 4);
                list.Add(d);
            }
            var peaks = new Dictionary<string, object>();
            foreach (Endpoint ep in endpoints.Values)
            {
                if (ep.Meter == null) continue;
                float p = 0f;
                try { ep.Meter.GetPeakValue(out p); } catch { }
                peaks[ep.Id] = Math.Round(p, 4);
            }
            var r = new Dictionary<string, object>();
            r["sessions"] = list;
            r["peaks"] = peaks;
            return r;
        }

        delegate void SessionAction(Session s);

        static object ForSessions(Dictionary<string, object> req, SessionAction action)
        {
            var pids = new HashSet<uint>();
            object raw;
            if (req.TryGetValue("pids", out raw) && raw is IEnumerable)
                foreach (object o in (IEnumerable)raw) pids.Add(Convert.ToUInt32(o));
            bool system = Bool(req, "system");
            int changed = 0;
            foreach (Session s in sessions)
            {
                if (s.Flow != EDataFlow.Render && !Bool(req, "includeCapture")) continue;
                if ((system && s.IsSystem) || (!s.IsSystem && pids.Contains(s.Pid)))
                {
                    try { action(s); changed++; } catch { }
                }
            }
            return changed;
        }

        static ProcInfo SystemProc()
        {
            var p = new ProcInfo();
            p.Name = "Systemsounds";
            p.Exe = "system";
            p.Path = "";
            return p;
        }

        static ProcInfo GetProc(uint pid)
        {
            ProcInfo info;
            if (procCache.TryGetValue(pid, out info)) return info;
            info = new ProcInfo();
            info.Path = "";
            info.Exe = "";
            info.Name = "";
            IntPtr h = Native.OpenProcess(0x1000, false, pid); // PROCESS_QUERY_LIMITED_INFORMATION
            if (h != IntPtr.Zero)
            {
                var sb = new StringBuilder(1024);
                uint size = (uint)sb.Capacity;
                if (Native.QueryFullProcessImageName(h, 0, sb, ref size)) info.Path = sb.ToString();
                Native.CloseHandle(h);
            }
            if (info.Path.Length > 0)
            {
                info.Exe = System.IO.Path.GetFileName(info.Path);
                try
                {
                    var vi = FileVersionInfo.GetVersionInfo(info.Path);
                    if (!string.IsNullOrEmpty(vi.FileDescription)) info.Name = vi.FileDescription.Trim();
                    else if (!string.IsNullOrEmpty(vi.ProductName)) info.Name = vi.ProductName.Trim();
                }
                catch { }
            }
            if (info.Exe.Length == 0)
            {
                try { info.Exe = Process.GetProcessById((int)pid).ProcessName + ".exe"; } catch { info.Exe = "pid" + pid; }
            }
            if (info.Name.Length == 0) info.Name = System.IO.Path.GetFileNameWithoutExtension(info.Exe);
            procCache[pid] = info;
            return info;
        }

        // ------------------------------------------------------------------ Ausgabegerät pro App

        static object policyFactory;
        static bool policyTried;

        static bool PolicyFactoryAvailable()
        {
            try { return GetPolicyFactory() != null; } catch { return false; }
        }

        static object GetPolicyFactory()
        {
            if (policyTried) return policyFactory;
            policyTried = true;
            bool modern = Environment.OSVersion.Version.Build >= 21390;
            Guid iid = modern ? typeof(IAudioPolicyConfigFactory21H2).GUID : typeof(IAudioPolicyConfigFactoryDownlevel).GUID;
            IntPtr cls;
            const string name = "Windows.Media.Internal.AudioPolicyConfig";
            if (Native.WindowsCreateString(name, name.Length, out cls) != 0) return null;
            try
            {
                IntPtr ptr;
                if (Native.RoGetActivationFactory(cls, ref iid, out ptr) != 0 || ptr == IntPtr.Zero) return null;
                object o = Marshal.GetObjectForIUnknown(ptr);
                Marshal.Release(ptr);
                if (modern) policyFactory = (IAudioPolicyConfigFactory21H2)o;
                else policyFactory = (IAudioPolicyConfigFactoryDownlevel)o;
            }
            finally { Native.WindowsDeleteString(cls); }
            return policyFactory;
        }

        static int PolicySet(uint pid, ERole role, IntPtr hstr)
        {
            object f = GetPolicyFactory();
            if (f == null) throw new Exception("Ausgabegerät pro App wird von dieser Windows-Version nicht unterstützt");
            var a = f as IAudioPolicyConfigFactory21H2;
            if (a != null) return a.SetPersistedDefaultAudioEndpoint(pid, EDataFlow.Render, role, hstr);
            return ((IAudioPolicyConfigFactoryDownlevel)f).SetPersistedDefaultAudioEndpoint(pid, EDataFlow.Render, role, hstr);
        }

        static object SetAppOutput(Dictionary<string, object> req)
        {
            string device = Str(req, "device");
            IntPtr hstr = IntPtr.Zero;
            if (!string.IsNullOrEmpty(device))
            {
                string full = MmDevApiPrefix + device + RenderSuffix;
                if (Native.WindowsCreateString(full, full.Length, out hstr) != 0) throw new Exception("Gerätekennung ungültig");
            }
            int done = 0;
            try
            {
                object raw;
                if (req.TryGetValue("pids", out raw) && raw is IEnumerable)
                {
                    foreach (object o in (IEnumerable)raw)
                    {
                        uint pid = Convert.ToUInt32(o);
                        int hr1 = PolicySet(pid, ERole.Multimedia, hstr);
                        int hr2 = PolicySet(pid, ERole.Console, hstr);
                        if (hr1 == 0 && hr2 == 0) done++;
                    }
                }
            }
            finally { if (hstr != IntPtr.Zero) Native.WindowsDeleteString(hstr); }
            return done;
        }

        static object GetAppOutput(uint pid)
        {
            object f = GetPolicyFactory();
            if (f == null) return null;
            IntPtr h;
            int hr;
            var a = f as IAudioPolicyConfigFactory21H2;
            if (a != null) hr = a.GetPersistedDefaultAudioEndpoint(pid, EDataFlow.Render, ERole.Multimedia, out h);
            else hr = ((IAudioPolicyConfigFactoryDownlevel)f).GetPersistedDefaultAudioEndpoint(pid, EDataFlow.Render, ERole.Multimedia, out h);
            if (hr != 0 || h == IntPtr.Zero) return null;
            uint len;
            IntPtr buf = Native.WindowsGetStringRawBuffer(h, out len);
            string s = Marshal.PtrToStringUni(buf, (int)len);
            Native.WindowsDeleteString(h);
            if (s.StartsWith(MmDevApiPrefix)) s = s.Substring(MmDevApiPrefix.Length);
            int hash = s.LastIndexOf("#{", StringComparison.Ordinal);
            if (hash > 0) s = s.Substring(0, hash);
            return s;
        }

        // ------------------------------------------------------------------ Sprechtaste

        static readonly HashSet<int> watched = new HashSet<int>();
        static readonly HashSet<int> held = new HashSet<int>();
        static Native.HookProc kbProc, msProc;
        static bool hooksStarted;

        static object WatchKeys(Dictionary<string, object> req)
        {
            lock (watched)
            {
                watched.Clear();
                held.Clear();
                object raw;
                if (req.TryGetValue("keys", out raw) && raw is IEnumerable)
                    foreach (object o in (IEnumerable)raw) watched.Add(Convert.ToInt32(o));
            }
            if (watched.Count > 0 && !hooksStarted) StartHooks();
            return watched.Count;
        }

        static void StartHooks()
        {
            hooksStarted = true;
            kbProc = KeyboardHook;
            msProc = MouseHook;
            var t = new Thread(delegate ()
            {
                IntPtr mod = Native.GetModuleHandle(null);
                Native.SetWindowsHookEx(13, kbProc, mod, 0); // WH_KEYBOARD_LL
                Native.SetWindowsHookEx(14, msProc, mod, 0); // WH_MOUSE_LL
                MSG msg;
                while (Native.GetMessage(out msg, IntPtr.Zero, 0, 0) > 0) { }
            });
            t.IsBackground = true;
            t.Start();
        }

        static void KeyChange(int vk, bool down)
        {
            bool emit = false;
            lock (watched)
            {
                if (!watched.Contains(vk)) return;
                if (down && !held.Contains(vk)) { held.Add(vk); emit = true; }
                else if (!down && held.Contains(vk)) { held.Remove(vk); emit = true; }
            }
            if (!emit) return;
            var d = new Dictionary<string, object>();
            d["event"] = "key";
            d["vk"] = vk;
            d["down"] = down;
            try { Emit(d); } catch { }
        }

        static IntPtr KeyboardHook(int nCode, IntPtr wParam, IntPtr lParam)
        {
            if (nCode >= 0)
            {
                int msg = wParam.ToInt32();
                int vk = Marshal.ReadInt32(lParam);
                if (msg == 0x100 || msg == 0x104) KeyChange(vk, true);
                else if (msg == 0x101 || msg == 0x105) KeyChange(vk, false);
            }
            return Native.CallNextHookEx(IntPtr.Zero, nCode, wParam, lParam);
        }

        static IntPtr MouseHook(int nCode, IntPtr wParam, IntPtr lParam)
        {
            if (nCode >= 0)
            {
                int msg = wParam.ToInt32();
                if (msg == 0x020B || msg == 0x020C)
                {
                    int data = Marshal.ReadInt32(lParam, 8) >> 16;
                    int vk = data == 1 ? 0x05 : data == 2 ? 0x06 : 0;
                    if (vk != 0) KeyChange(vk, msg == 0x020B);
                }
                else if (msg == 0x0207) KeyChange(0x04, true);
                else if (msg == 0x0208) KeyChange(0x04, false);
            }
            return Native.CallNextHookEx(IntPtr.Zero, nCode, wParam, lParam);
        }

        // ------------------------------------------------------------------ Extras

        static object IconPng(string path)
        {
            if (string.IsNullOrEmpty(path) || !File.Exists(path)) return null;
            using (Icon ico = Icon.ExtractAssociatedIcon(path))
            {
                if (ico == null) return null;
                using (Bitmap src = ico.ToBitmap())
                using (var dst = new Bitmap(64, 64, PixelFormat.Format32bppArgb))
                {
                    using (Graphics g = Graphics.FromImage(dst))
                    {
                        g.InterpolationMode = InterpolationMode.HighQualityBicubic;
                        g.PixelOffsetMode = PixelOffsetMode.HighQuality;
                        g.DrawImage(src, 0, 0, 64, 64);
                    }
                    using (var ms = new MemoryStream())
                    {
                        dst.Save(ms, ImageFormat.Png);
                        return "data:image/png;base64," + Convert.ToBase64String(ms.ToArray());
                    }
                }
            }
        }

        static object AsioDrivers()
        {
            var names = new SortedSet<string>(StringComparer.OrdinalIgnoreCase);
            foreach (RegistryView view in new RegistryView[] { RegistryView.Registry64, RegistryView.Registry32 })
            {
                try
                {
                    using (RegistryKey root = RegistryKey.OpenBaseKey(RegistryHive.LocalMachine, view))
                    using (RegistryKey asio = root.OpenSubKey(@"SOFTWARE\ASIO"))
                    {
                        if (asio == null) continue;
                        foreach (string n in asio.GetSubKeyNames()) names.Add(n);
                    }
                }
                catch { }
            }
            return new List<string>(names);
        }

        // ------------------------------------------------------------------ Eigenschaften lesen

        static string ReadString(IPropertyStore props, PROPERTYKEY key)
        {
            if (props == null) return "";
            PROPVARIANT v;
            if (props.GetValue(ref key, out v) != 0) return "";
            string s = "";
            if (v.vt == 31 && v.p1 != IntPtr.Zero) s = Marshal.PtrToStringUni(v.p1);
            Native.PropVariantClear(ref v);
            return s ?? "";
        }

        static long ReadUInt(IPropertyStore props, PROPERTYKEY key)
        {
            if (props == null) return -1;
            PROPVARIANT v;
            if (props.GetValue(ref key, out v) != 0) return -1;
            long r = -1;
            if (v.vt == 19 || v.vt == 3) r = v.p1.ToInt64() & 0xFFFFFFFFL;
            Native.PropVariantClear(ref v);
            return r;
        }

        static object ReadFormat(IPropertyStore props)
        {
            if (props == null) return null;
            PROPERTYKEY key = PKEY_DeviceFormat;
            PROPVARIANT v;
            if (props.GetValue(ref key, out v) != 0) return null;
            Dictionary<string, object> d = null;
            try
            {
                if (v.vt == 65 && v.p2 != IntPtr.Zero)
                {
                    int size = (int)(v.p1.ToInt64() & 0xFFFFFFFFL);
                    if (size >= 16)
                    {
                        byte[] b = new byte[Math.Min(size, 64)];
                        Marshal.Copy(v.p2, b, 0, b.Length);
                        int tag = BitConverter.ToUInt16(b, 0);
                        int bits = BitConverter.ToUInt16(b, 14);
                        if (tag == 0xFFFE && b.Length >= 20)
                        {
                            int valid = BitConverter.ToUInt16(b, 18);
                            if (valid > 0) bits = valid;
                        }
                        d = new Dictionary<string, object>();
                        d["channels"] = (int)BitConverter.ToUInt16(b, 2);
                        d["rate"] = (long)BitConverter.ToUInt32(b, 4);
                        d["bits"] = bits;
                    }
                }
            }
            finally { Native.PropVariantClear(ref v); }
            return d;
        }

        // ------------------------------------------------------------------ Hilfen

        static string Str(Dictionary<string, object> d, string k)
        {
            object v;
            return d.TryGetValue(k, out v) && v != null ? Convert.ToString(v) : null;
        }

        static double Num(Dictionary<string, object> d, string k)
        {
            object v;
            if (!d.TryGetValue(k, out v) || v == null) throw new Exception("Wert fehlt: " + k);
            return Convert.ToDouble(v, System.Globalization.CultureInfo.InvariantCulture);
        }

        static bool Bool(Dictionary<string, object> d, string k)
        {
            object v;
            return d.TryGetValue(k, out v) && v is bool && (bool)v;
        }

        static float Clamp01(double v)
        {
            return (float)Math.Max(0, Math.Min(1, v));
        }
    }
}
