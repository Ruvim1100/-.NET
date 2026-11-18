using System.Diagnostics;
using System.IO;
using System.Threading.Tasks;
using Xunit;

public class StartupTests
{
    [Fact]
    public async Task ProbePrintsStartupMessage()
    {
        var start = new ProcessStartInfo("dotnet")
        {
            RedirectStandardOutput = true,
            UseShellExecute = false
        };
        start.ArgumentList.Add(Path.Combine(System.AppContext.BaseDirectory, "OrderProbe.dll"));
        using var process = Process.Start(start)!;
        var message = await process.StandardOutput.ReadToEndAsync();
        await process.WaitForExitAsync();
        Assert.Equal(0, process.ExitCode);
        Assert.Equal("Orders online", message.TrimEnd());
    }
}
