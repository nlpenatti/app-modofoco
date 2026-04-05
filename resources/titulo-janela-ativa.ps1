Add-Type @"
using System;
using System.Runtime.InteropServices;
using System.Text;
public class JanelaPrimeiroPlano {
  [DllImport("user32.dll")]
  public static extern IntPtr GetForegroundWindow();
  [DllImport("user32.dll", CharSet = CharSet.Unicode)]
  public static extern int GetWindowText(IntPtr hWnd, StringBuilder texto, int maxCaracteres);
  public static string ObterTitulo() {
    IntPtr h = GetForegroundWindow();
    if (h == IntPtr.Zero) { return ""; }
    var sb = new StringBuilder(512);
    GetWindowText(h, sb, sb.Capacity);
    return sb.ToString();
  }
}
"@
[JanelaPrimeiroPlano]::ObterTitulo()
