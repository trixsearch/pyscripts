package com.jio.cwms.onboard.filter;

import java.io.IOException;
import java.net.URLDecoder;
import java.text.Normalizer;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Enumeration;
import java.util.List;
import java.util.regex.Pattern;

import org.springframework.stereotype.Component;

import jakarta.servlet.Filter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletRequestWrapper;
import jakarta.servlet.http.HttpServletResponse;

@Component
public class HttpRequestParamScannerFilter implements Filter {

	@Override
	public void doFilter(final ServletRequest req, final ServletResponse res, final FilterChain chain) throws IOException, ServletException {
		final HttpServletRequest request = (HttpServletRequest) req;
		final HttpServletResponse response = (HttpServletResponse) res;
		if (request.getRequestURI().contains("/downloadCsv/testmodell.csv")) {
			chain.doFilter(request,response);
			return;
		}
		if (isRequestHarmful(request)){
			final Enumeration<String> strE = request.getParameterNames();
			String p = null;
			while (strE.hasMoreElements()) {
				p = strE.nextElement();
				request.getParameter(p);
			}
			req.setAttribute("message", "Request contains potentially harmful characters");
			final HttpServletRequest request1 = new HttpServletRequestWrapper((HttpServletRequest) req) {
				@Override
				public String getRequestURI() {
					return "/invalidContentError";
				}
			};
			chain.doFilter (request1, response);
		} else {
			chain.doFilter(request, response);
		}

	}

	private boolean isRequestHarmful(final ServletRequest servletRequest) {
		final HttpServletRequest request = (HttpServletRequest) servletRequest;
		final Enumeration<String> enrtn =request.getParameterNames();
		String paraName = null;
		String[] paraVal = null;
		while(enrtn.hasMoreElements()){
			paraName = enrtn.nextElement();
			paraVal = request.getParameterValues(paraName);
			if (paraVal != null) {
				for (final String str : paraVal) {
					if (!stripXSS(str)) {
						return true;
					}
				}
			}
		}
		return false;
	}

	@SuppressWarnings("deprecation")
	private boolean stripXSS(String value){
		value = URLDecoder.decode(URLDecoder.decode(value));
		var cleanValue = value;
		if (value == null) {
			return false;
		}
		cleanValue = Normalizer.normalize(value, Normalizer.Form.NFD);
		// cleanValue = Encode.forHtml(cleanValue); //Encodes all special characters to
		// remove the possibility of XSS
		// Avoid null characters
		final boolean isNullCharacter = cleanValue.contains("\0");
		// Avoid anything between script tags
		var scriptPattern = Pattern.compile("<script>(.*?)</script>", Pattern.CASE_INSENSITIVE);
		final boolean isScriptPattern = scriptPattern.matcher(cleanValue).find();
		// Avoid anything in a src='...' type of expression
		scriptPattern = Pattern.compile("src[\r\n]*=[\r\n]*\\\'(.*?)\\\'",
				Pattern.CASE_INSENSITIVE | Pattern.MULTILINE | Pattern.DOTALL);
		final boolean isSrcTag = scriptPattern.matcher(cleanValue).find();
		scriptPattern = Pattern.compile("src[\r\n]*=[\r\n]*\\\"(.*?)\\\"",
				Pattern.CASE_INSENSITIVE | Pattern.MULTILINE | Pattern.DOTALL);
		final boolean isSrcTagWithDoubleQuote = scriptPattern.matcher(cleanValue).find();
		// Remove any lonesome </script> tag
		scriptPattern = Pattern.compile("</script>", Pattern.CASE_INSENSITIVE);
		final boolean isScriptCloseTag = scriptPattern.matcher(cleanValue).find();
		// Remove any lonesome <script ...> tag
		scriptPattern = Pattern.compile("<script(.*?)>",
				Pattern.CASE_INSENSITIVE | Pattern.MULTILINE | Pattern.DOTALL);
		final boolean isScriptTagWithAttribute = scriptPattern.matcher(cleanValue).find();
		// Avoid eval(...) expressions
		scriptPattern = Pattern.compile("eval\\((.*?)\\)",
				Pattern.CASE_INSENSITIVE | Pattern.MULTILINE | Pattern.DOTALL);
		final boolean isEval = scriptPattern.matcher(cleanValue).find();
		// Avoid expression(...) expressions
		scriptPattern = Pattern.compile("expression\\((.*?)\\)",
				Pattern.CASE_INSENSITIVE | Pattern.MULTILINE | Pattern.DOTALL);
		final boolean isExpression = scriptPattern.matcher(cleanValue).find();
		// Avoid javascript:... expressions
		scriptPattern = Pattern.compile("javascript:", Pattern.CASE_INSENSITIVE);
		final boolean isJavaScript = scriptPattern.matcher(cleanValue).find();
		// Avoid vbscript:... expressions
		scriptPattern = Pattern.compile("vbscript:", Pattern.CASE_INSENSITIVE);
		final boolean isVBScript = scriptPattern.matcher(cleanValue).find();
		// Avoid onload= expressions
		scriptPattern = Pattern.compile("onload(.*?)=", Pattern.CASE_INSENSITIVE | Pattern.MULTILINE | Pattern.DOTALL);
		final boolean isOnLoad = scriptPattern.matcher(cleanValue).find();
		var isAllowedTags =true;
		if (cleanValue.contains("<") || cleanValue.contains(">")) {

			final var p = Pattern.compile("<([^\\s>/]+)");
			final var m = p.matcher(cleanValue);

			final List<String> stringList = new ArrayList<>();
			while (m.find()) {
				final String tag = m.group(1);
				stringList.add(tag);
			}
			isAllowedTags = containsValidHtmlTag(stringList);
		}
		return (!isNullCharacter && !isScriptPattern && !isSrcTag && !isSrcTagWithDoubleQuote && !isScriptCloseTag
				&& !isScriptTagWithAttribute && !isEval && !isExpression && !isJavaScript && !isVBScript
				&& !isOnLoad) && (checkSqlCharaters(cleanValue)) && (isAllowedTags);
	}

	public boolean containsValidHtmlTag(final List<String> list){
		final List<String> stringList=Arrays.asList("b","i","u","a","span","sup","sub","hr","br","strong","em","p");
		return list.stream().allMatch(stringList::contains);

	}

	public boolean checkSqlCharaters(final String value) {
		var isSqlCharaterNotPresent = false;
		final boolean condition = !"".equals(value) && !value.contains("<") && !value.contains(">") && !value.contains("%") && !value.contains("&")
				&& !value.contains("\\+")
				&& !value.contains("\\(")
				&& !value.contains(";")
				&& !value.contains("\n")
				&& !value.contains("\r")
				&& !value.contains("'")
				&& !value.contains("..\\\\")
				&& !value.contains("\\\\")
				&& !value.contains("../");
		if(condition) {
			isSqlCharaterNotPresent= true;
		}
		return isSqlCharaterNotPresent;
	}

}
