Add-Type @"
using System;
using System.Runtime.InteropServices;
using System.Text;
public class JanelaPrimeiroPlano {
  [DllImport("user32.dll")]
  public static extern IntPtr GetForegroundWindow();
  [DllImport("user32.dll", CharSet = CharSet.Unicode)]
  public static extern int GetWindowText(IntPtr hWnd, StringBuilder texto, int maxCaracteres);
  [DllImport("user32.dll")]
  public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);

  private const int SW_MINIMIZE = 6;

  public static string ObterTitulo() {
    IntPtr h = GetForegroundWindow();
    if (h == IntPtr.Zero) { return ""; }
    var sb = new StringBuilder(512);
    GetWindowText(h, sb, sb.Capacity);
    return sb.ToString();
  }

  public static void MinimizarAtiva() {
    IntPtr h = GetForegroundWindow();
    if (h != IntPtr.Zero) {
      ShowWindow(h, SW_MINIMIZE);
    }
  }
}
"@

if ($args.Count -gt 0 -and $args[0] -eq "minimizar") {
  [JanelaPrimeiroPlano]::MinimizarAtiva()
} else {
  [JanelaPrimeiroPlano]::ObterTitulo()
}
